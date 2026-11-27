"""NexusOps NOC - backend local defensivo.

Compatível com execução Python e preparação para PyInstaller. Por segurança,
este serviço escuta apenas em localhost e só permite snapshots VNC de IPs
explicitamente cadastrados em config.json.
"""
from __future__ import annotations

import base64
import ipaddress
import json
import logging
import os
import sqlite3
import sys
import threading
import time
import uuid
import subprocess
import re
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict, deque
from contextlib import closing
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from flask import Flask, Response, g, jsonify, request, send_file
from web_import import WebImportError, fetch_document, probe_document, zabbix_map_info
from backend.settings import Settings, load_dotenv
from backend.repository import InventoryRecord, InventoryRepository, migrate
from backend.resilience import ResilientReads
from werkzeug.exceptions import HTTPException

APP_NAME = "Axiom Studio"
HOST = "127.0.0.1"


def runtime_dir() -> Path:
    """Diretório do executável/script, não o diretório de trabalho atual."""
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


BASE_DIR = runtime_dir()
load_dotenv(BASE_DIR / '.env')
SETTINGS = Settings.from_environment()
PORT = SETTINGS.port
CONFIG_PATH = Path(os.environ.get("NEXUSOPS_CONFIG", str(BASE_DIR / "config.json")))
DB_PATH = Path(os.environ.get("NEXUSOPS_DB", str(BASE_DIR / "nexusops.db")))
LOG_PATH = BASE_DIR / "nexusops.log"

logging.basicConfig(
    level=os.environ.get("NEXUSOPS_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("nexusops")
app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["MAX_CONTENT_LENGTH"] = 48 * 1024 * 1024  # só /api/export/* pode passar de 1 MB (ver limit_small_bodies)
_db_lock = threading.Lock()
_request_counts = defaultdict(int)
_import_calls = defaultdict(deque)
_request_lock = threading.Lock()
_web_previews = {}
_endpoint_metrics = {}
_discovery_jobs = {}
_discovery_lock = threading.Lock()
_started_at = time.monotonic()
_reads = ResilientReads(SETTINGS.failure_threshold, SETTINGS.cooldown, SETTINGS.retries)
inventory_repository = InventoryRepository(lambda: connect_db(), _db_lock)


@app.route('/api/web/preview', methods=['POST'])
def create_web_preview():
    payload = request.get_json(silent=True)
    html = payload.get('html') if isinstance(payload, dict) else None
    if not isinstance(html, str) or len(html.encode('utf-8')) > 900_000:
        return jsonify(success=False, error='Prévia HTML inválida ou maior que 900 KB.'), 400
    token = uuid.uuid4().hex
    now = time.monotonic()
    with _request_lock:
        for key, value in list(_web_previews.items()):
            if now - value[0] > 1800:
                del _web_previews[key]
        if len(_web_previews) >= 40:
            del _web_previews[next(iter(_web_previews))]
        _web_previews[token] = (now, html)
    return jsonify(success=True, url='/web-preview/' + token)


@app.route('/web-preview/<token>')
def get_web_preview(token):
    with _request_lock:
        value = _web_previews.get(token)
    if not value or time.monotonic() - value[0] > 1800:
        return 'Prévia expirada. Atualize o designer.', 404
    response = Response(value[1], mimetype='text/html')
    response.headers['Content-Security-Policy'] = "sandbox allow-scripts allow-forms allow-popups allow-presentation; object-src 'none'; frame-src https: http:; child-src https: http:; form-action 'none'"
    return response


@app.before_request
def request_context():
    g.correlation_id = uuid.uuid4().hex
    g.started_at = time.perf_counter()
    api_path = request.path.replace('/api/v1/', '/api/', 1)
    if api_path.startswith('/api/web/') or api_path == '/api/diagnostics/ping' or api_path.startswith('/api/discovery/'):
        origin = request.headers.get('Origin')
        if origin and origin != request.host_url.rstrip('/'):
            return jsonify(success=False, error='Importação permitida apenas pela interface local.'), 403
        now = time.monotonic()
        with _request_lock:
            calls = _import_calls[(request.remote_addr, api_path)]
            while calls and calls[0] < now - 60:
                calls.popleft()
            payload = request.get_json(silent=True)
            limit = 120 if api_path == '/api/web/import' and isinstance(payload, dict) and payload.get('kind') == 'json' else 30
            if len(calls) >= limit:
                return jsonify(success=False, error='Limite de consultas por minuto atingido. Aguarde e tente novamente.'), 429
            calls.append(now)


@app.after_request
def request_observability(response):
    response.headers['X-Correlation-ID'] = getattr(g, 'correlation_id', '')
    elapsed = round((time.perf_counter() - getattr(g, 'started_at', time.perf_counter())) * 1000, 2)
    with _request_lock:
        _request_counts[str(response.status_code)] += 1
        key = (request.method, request.url_rule.rule if request.url_rule else 'unmatched', str(response.status_code))
        metric = _endpoint_metrics.setdefault(key, [0, 0.0])
        metric[0] += 1
        metric[1] += elapsed / 1000
    if request.path.startswith('/api/') and response.is_json and response.status_code >= 400:
        data = response.get_json(silent=True)
        if isinstance(data, dict):
            data.setdefault('success', False)
            data.setdefault('code', 'http_' + str(response.status_code))
            data.setdefault('request_id', getattr(g, 'correlation_id', ''))
            response.set_data(app.json.dumps(data))
    log.info(json.dumps({'event': 'http.request', 'request_id': getattr(g, 'correlation_id', ''),
                         'method': request.method, 'route': request.url_rule.rule if request.url_rule else 'unmatched',
                         'status': response.status_code, 'duration_ms': elapsed}))
    return response


@app.route('/health/liveness')
def liveness():
    return jsonify(success=True, status='alive')


@app.route('/health/readiness')
def readiness():
    return health()


@app.route('/api/metrics')
def request_metrics():
    with _request_lock:
        counts = dict(_request_counts)
    return jsonify(success=True, requests_by_status=counts, uptime_seconds=round(time.monotonic()-_started_at, 1), circuits=_reads.summary())


@app.route('/metrics')
def prometheus_metrics():
    lines = ['# TYPE daedalus_http_requests_total counter', '# TYPE daedalus_http_duration_seconds_sum counter']
    with _request_lock:
        for (method, route, status), (count, duration) in sorted(_endpoint_metrics.items()):
            labels = 'method="' + method + '",route="' + route + '",status="' + status + '"'
            lines.extend([f'daedalus_http_requests_total{{{labels}}} {count}', f'daedalus_http_duration_seconds_sum{{{labels}}} {duration:.6f}'])
    lines.extend(['# TYPE daedalus_uptime_seconds gauge', f'daedalus_uptime_seconds {time.monotonic()-_started_at:.1f}',
                  '# TYPE daedalus_circuits_open gauge', f'daedalus_circuits_open {_reads.summary()["open"]}'])
    return Response('\n'.join(lines) + '\n', mimetype='text/plain')


@app.errorhandler(Exception)
def api_exception(exc):
    if isinstance(exc, HTTPException):
        if not request.path.startswith('/api/'):
            return exc
        return jsonify(success=False, error=exc.name, code='http_' + str(exc.code)), exc.code
    log.error('api.unhandled request_id=%s error_type=%s', getattr(g, 'correlation_id', ''), type(exc).__name__)
    return jsonify(success=False, error='Não foi possível concluir a operação. Consulte o identificador da requisição.', code='internal_error'), 500


@app.route('/api/diagnostics/ping', methods=['POST'])
def ping_device():
    payload = request.get_json(silent=True)
    try:
        target = ipaddress.ip_address(payload.get('ip', '') if isinstance(payload, dict) else '')
        if target.version != 4 or target.is_multicast or target.is_unspecified or target.is_link_local:
            raise ValueError()
    except ValueError:
        return jsonify(success=False, error='Informe um endereço IPv4 unicast válido.'), 400
    ip = str(target)
    args = ['ping', '-n', '1', '-w', '1500', ip] if os.name == 'nt' else ['ping', '-c', '1', '-W', '2', ip]
    try:
        result = subprocess.run(args, capture_output=True, text=True, errors='replace', timeout=4, creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        match = re.search(r'(?:time|tempo)[=<]\s*(\d+(?:\.\d+)?)', result.stdout, re.I)
        online = result.returncode == 0 and ('ttl=' in result.stdout.lower() or match is not None)
        return jsonify(success=True, ip=ip, online=online, latency_ms=float(match.group(1)) if match and online else None, timestamp=utc_now())
    except (OSError, subprocess.TimeoutExpired):
        return jsonify(success=False, error='Ping indisponível ou tempo limite excedido.'), 502


def _discovery_ping(address: str) -> dict[str, Any]:
    """Consulta ICMP limitada a endereços privados; não realiza varredura de portas."""
    args = ['ping', '-n', '1', '-w', '700', address] if os.name == 'nt' else ['ping', '-c', '1', '-W', '1', address]
    started = time.perf_counter()
    try:
        result = subprocess.run(args, capture_output=True, text=True, errors='replace', timeout=2,
                                creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        match = re.search(r'(?:time|tempo)[=<]\s*(\d+(?:\.\d+)?)', result.stdout, re.I)
        online = result.returncode == 0 and ('ttl=' in result.stdout.lower() or match is not None)
    except (OSError, subprocess.TimeoutExpired):
        online, match = False, None
    hostname = ''
    if online:
        try:
            hostname = socket.gethostbyaddr(address)[0]
        except (OSError, socket.herror):
            pass
    return {'ip': address, 'online': online, 'hostname': hostname,
            'latency_ms': float(match.group(1)) if match and online else None,
            'confidence': 95 if online and hostname else 80 if online else 25,
            'duration_ms': round((time.perf_counter() - started) * 1000, 1)}


def _run_discovery_job(job_id: str, addresses: list[str]) -> None:
    with _discovery_lock:
        job = _discovery_jobs.get(job_id)
        if not job:
            return
        job.update(status='running', started_at=utc_now())
    try:
        with ThreadPoolExecutor(max_workers=min(16, max(1, len(addresses)))) as pool:
            futures = {pool.submit(_discovery_ping, address): address for address in addresses}
            for future in as_completed(futures):
                with _discovery_lock:
                    job = _discovery_jobs.get(job_id)
                    if not job or job.get('cancel_requested'):
                        if job:
                            job.update(status='cancelled', completed_at=utc_now())
                        for pending in futures:
                            pending.cancel()
                        return
                try:
                    result = future.result()
                except Exception as exc:  # worker isolation
                    result = {'ip': futures[future], 'online': False, 'confidence': 0,
                              'error': type(exc).__name__}
                with _discovery_lock:
                    job['results'].append(result)
                    job['processed'] += 1
                    if result.get('online'):
                        job['resolved'] += 1
        with _discovery_lock:
            job = _discovery_jobs.get(job_id)
            if job:
                job.update(status='completed', completed_at=utc_now())
    except Exception as exc:
        log.warning('discovery.job.failed id=%s error_type=%s', job_id, type(exc).__name__)
        with _discovery_lock:
            job = _discovery_jobs.get(job_id)
            if job:
                job.update(status='failed', error='Não foi possível concluir a descoberta.', completed_at=utc_now())


@app.route('/api/discovery/jobs', methods=['GET', 'POST'])
def discovery_jobs_api():
    if request.method == 'GET':
        with _discovery_lock:
            jobs = [dict(job) for job in _discovery_jobs.values()]
        jobs.sort(key=lambda item: item['created_at'], reverse=True)
        return jsonify(success=True, items=jobs[:30])
    payload = request.get_json(silent=True)
    target_text = payload.get('target', '') if isinstance(payload, dict) else ''
    try:
        network = ipaddress.ip_network(str(target_text).strip(), strict=False)
        if network.version != 4 or not (network.is_private or network.is_loopback) or network.num_addresses > 256:
            raise ValueError()
    except ValueError:
        return jsonify(success=False, error='Use uma faixa IPv4 privada com no máximo 256 endereços, por exemplo 192.168.1.0/24.'), 400
    addresses = [str(address) for address in network.hosts()]
    if not addresses:
        addresses = [str(network.network_address)]
    job_id = uuid.uuid4().hex
    job = {'id': job_id, 'name': str(payload.get('name') or network), 'target': str(network),
           'status': 'queued', 'created_at': utc_now(), 'started_at': None, 'completed_at': None,
           'total': len(addresses), 'processed': 0, 'resolved': 0, 'results': [], 'error': ''}
    with _discovery_lock:
        if len(_discovery_jobs) >= 30:
            oldest = min(_discovery_jobs.values(), key=lambda item: item['created_at'])['id']
            del _discovery_jobs[oldest]
        _discovery_jobs[job_id] = job
    threading.Thread(target=_run_discovery_job, args=(job_id, addresses), daemon=True).start()
    return jsonify(success=True, job=job), 202


@app.route('/api/discovery/jobs/<job_id>', methods=['GET', 'DELETE'])
def discovery_job_api(job_id: str):
    with _discovery_lock:
        job = _discovery_jobs.get(job_id)
        if not job:
            return jsonify(success=False, error='Job de descoberta não encontrado.'), 404
        if request.method == 'DELETE' and job['status'] in {'queued', 'running'}:
            job['cancel_requested'] = True
        snapshot = dict(job)
    return jsonify(success=True, job=snapshot)


@app.route('/api/web/import', methods=['POST'])
def import_web_document():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('url'), str):
        return jsonify(success=False, error='Informe url em um objeto JSON.'), 400
    kind = payload.get('kind', 'html')
    if kind not in {'html', 'json'}:
        return jsonify(success=False, error='kind deve ser html ou json.'), 400
    try:
        document = _reads.call('web:' + (urlparse(payload['url']).hostname or ''), lambda: fetch_document(payload['url'], kind))
        if kind == 'json':
            document['data'] = json.loads(document.pop('content'))
        else:
            document['html'] = document.pop('content')
        return jsonify(success=True, **document)
    except WebImportError as exc:
        return jsonify(success=False, error=str(exc)), 400
    except (OSError, ValueError) as exc:
        log.warning('web.import.failed request_id=%s error_type=%s', g.correlation_id, type(exc).__name__)
        return jsonify(success=False, error=_net_error(exc)), 502


def _net_error(exc: Exception) -> str:
    """Mensagem específica para falhas de rede ao ler uma URL."""
    from urllib.error import HTTPError, URLError
    if isinstance(exc, HTTPError):
        if exc.code in (401, 403):
            return f"O serviço recusou o acesso (HTTP {exc.code}). A página exige login ou permissão; use o conector com token de API."
        if exc.code == 404:
            return "Endereço não encontrado (HTTP 404). Confira o caminho da URL."
        return f"O serviço respondeu com erro HTTP {exc.code}."
    reason = getattr(exc, "reason", exc)
    if isinstance(reason, TimeoutError) or "timed out" in str(reason).lower():
        return "O serviço não respondeu a tempo. Confira se este computador alcança o endereço (VPN, firewall, IP correto)."
    if isinstance(exc, URLError) or isinstance(exc, OSError):
        return "Não foi possível conectar ao serviço (" + str(reason)[:120] + "). Confira rede, VPN e se o endereço está certo."
    return "O serviço não respondeu."


@app.route('/api/web/probe', methods=['POST'])
def probe_web_document():
    """Detect HTML, JSON or live media for the single URL entry point."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or not isinstance(payload.get('url'), str):
        return jsonify(success=False, error='Informe url em um objeto JSON.'), 400
    try:
        document = _reads.call(
            'web:' + (urlparse(payload['url']).hostname or ''),
            lambda: probe_document(payload['url']),
        )
        return jsonify(success=True, **document)
    except WebImportError as exc:
        return jsonify(success=False, error=str(exc)), 400
    except OSError as exc:
        log.warning('web.probe.failed request_id=%s error_type=%s', g.correlation_id, type(exc).__name__)
        return jsonify(success=False, error=_net_error(exc)), 502

DEFAULT_CONFIG: dict[str, Any] = {
    "project_name": "Axiom Studio - Operação Unificada",
    "transition_seconds": 15,
    "auto_start_rotation": True,
    "tabs": [],
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=5)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA busy_timeout=5000")
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _db_lock, closing(connect_db()) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        migrate(conn)



def audit(event: str, details: dict[str, Any] | None = None) -> None:
    """Registra metadados sem armazenar segredos ou imagens VNC."""
    try:
        with _db_lock, closing(connect_db()) as conn:
            conn.execute(
                "INSERT INTO audit_log(created_at,event,details_json,remote_addr) VALUES(?,?,?,?)",
                (utc_now(), event[:80], json.dumps(details or {}, ensure_ascii=False)[:8000], request.remote_addr if request else None),
            )
            conn.commit()
    except Exception:
        log.exception("Falha ao gravar auditoria")


def validate_config(data: Any) -> tuple[dict[str, Any] | None, str | None]:
    if not isinstance(data, dict):
        return None, "A configuração precisa ser um objeto JSON."
    result = dict(DEFAULT_CONFIG)
    result.update(data)
    try:
        transition = int(result.get("transition_seconds", 15))
    except (TypeError, ValueError):
        return None, "transition_seconds precisa ser um número inteiro."
    if not 3 <= transition <= 3600:
        return None, "transition_seconds deve ficar entre 3 e 3600 segundos."
    result["transition_seconds"] = transition
    result["auto_start_rotation"] = bool(result.get("auto_start_rotation", True))
    tabs = result.get("tabs", [])
    if not isinstance(tabs, list):
        return None, "tabs precisa ser uma lista."
    seen: set[str] = set()
    for tab in tabs:
        if not isinstance(tab, dict) or not isinstance(tab.get("id"), str) or not tab["id"].strip():
            return None, "Cada aba precisa ser um objeto com id não vazio."
        if tab["id"] in seen:
            return None, f"ID de aba duplicado: {tab['id']}"
        seen.add(tab["id"])
        if tab.get("type") == "external_url":
            url = tab.get("url", "")
            # HTTPS is accepted for external services. Plain HTTP is restricted to
            # loopback or RFC1918 LAN addresses, which supports explicitly entered
            # internal NOC dashboards without allowing arbitrary cleartext sites.
            if not isinstance(url, str):
                return None, f"URL inválida na aba {tab['id']}."
            parsed_url = urlparse(url)
            allowed_http_host = parsed_url.hostname in {"localhost"}
            if parsed_url.hostname:
                try:
                    address = ipaddress.ip_address(parsed_url.hostname)
                    allowed_http_host = address.is_loopback or address.is_private
                except ValueError:
                    pass
            valid_scheme = parsed_url.scheme == "https" or (parsed_url.scheme == "http" and allowed_http_host)
            if not valid_scheme or not parsed_url.hostname or parsed_url.username or parsed_url.password:
                return None, f"URL não permitida na aba {tab['id']}; use HTTPS ou HTTP em localhost/rede privada."
        panels = tab.get("vnc_panels", [])
        if panels and not isinstance(panels, list):
            return None, f"vnc_panels da aba {tab['id']} precisa ser uma lista."
        for panel in panels:
            if not isinstance(panel, dict) or not panel.get("target_ip"):
                return None, f"Painel VNC inválido na aba {tab['id']}."
            try:
                ipaddress.ip_address(str(panel["target_ip"]))
            except ValueError:
                return None, f"IP inválido no painel VNC da aba {tab['id']}."
            try:
                interval = int(panel.get("refresh_interval_seconds", 5))
            except (TypeError, ValueError):
                return None, "refresh_interval_seconds precisa ser inteiro."
            if not 2 <= interval <= 300:
                return None, "refresh_interval_seconds deve ficar entre 2 e 300 segundos."
            panel["refresh_interval_seconds"] = interval
    return result, None


def load_local_config() -> dict[str, Any]:
    if not CONFIG_PATH.is_file():
        raise FileNotFoundError(f"Configuração não encontrada: {CONFIG_PATH}")
    with CONFIG_PATH.open("r", encoding="utf-8-sig") as stream:
        raw = json.load(stream)
    config, error = validate_config(raw)
    if error:
        raise ValueError(error)
    assert config is not None
    return config


def configured_vnc_ips(config: dict[str, Any]) -> set[str]:
    ips: set[str] = set()
    for tab in config.get("tabs", []):
        for panel in tab.get("vnc_panels", []) or []:
            try:
                ips.add(str(ipaddress.ip_address(panel.get("target_ip", ""))))
            except ValueError:
                continue
    return ips


@app.before_request
def limit_small_bodies():
    """Mantém o limite de 1 MB em todas as rotas, exceto a exportação do HeartPulse NOC."""
    if request.path.startswith("/api/export/"):
        return None
    if (request.content_length or 0) > 1 * 1024 * 1024:
        return jsonify(success=False, error="Requisição maior que o limite de 1 MB."), 413
    return None


@app.after_request
def security_headers(response):
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


@app.errorhandler(413)
def too_large(_error):
    return jsonify(success=False, error="Requisição maior que o limite de 1 MB."), 413


@app.route("/")
def index():
    html_path = BASE_DIR / "Daedalus_Core_NOC_v8.html"
    if not html_path.is_file():
        return jsonify(success=False, error="Frontend Daedalus não encontrado ao lado do servidor."), 503
    return send_file(html_path, mimetype="text/html")


@app.route('/web-studio.js')
def web_studio_asset():
    return send_file(BASE_DIR / 'web-studio.js', mimetype='application/javascript')


@app.route("/api/health")
def health():
    try:
        config = load_local_config()
        with closing(connect_db()) as conn:
            conn.execute("SELECT 1").fetchone()
        return jsonify(success=True, service=APP_NAME, status="online", timestamp=utc_now(), tabs=len(config["tabs"]), database="ok")
    except Exception as exc:
        log.warning("Health check degradado: %s", exc)
        return jsonify(success=False, service=APP_NAME, status="degraded", error=str(exc), timestamp=utc_now()), 503


def integration_status() -> dict[str, bool]:
    return {
        "zabbix": bool(os.environ.get("DAEDALUS_ZABBIX_URL", "").strip() and os.environ.get("DAEDALUS_ZABBIX_API_TOKEN", "").strip()),
        "metabase": bool(os.environ.get("DAEDALUS_METABASE_URL", "").strip() and os.environ.get("DAEDALUS_METABASE_API_KEY", "").strip()),
    }


def integration_url(base: str, path: str) -> str:
    parsed = urlparse(base)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Configure uma URL HTTP/HTTPS válida nas variáveis DAEDALUS_*_URL.")
    return base.rstrip("/") + path


def integration_request(url: str, *, method: str = "GET", payload: dict[str, Any] | None = None, headers: dict[str, str] | None = None) -> Any:
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request_headers = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        request_headers.setdefault("Content-Type", "application/json")
    req = Request(url, data=data, headers=request_headers, method=method)
    def read():
        with urlopen(req, timeout=SETTINGS.timeout) as response:
            raw = response.read(5_242_881)
        if len(raw) > 5_242_880:
            raise ValueError("A resposta do serviço excede o limite de 5 MB.")
        return json.loads(raw.decode("utf-8"))
    # Existing integration POSTs are read-only queries, never control commands.
    return _reads.call('integration:' + (urlparse(url).hostname or ''), read)



@app.route("/api/integrations/status")
def get_integration_status():
    """Expose configured flags only. Never return credentials or service URLs."""
    return jsonify(success=True, configured=integration_status())


@app.route("/api/integrations/zabbix/config", methods=["POST"])
def save_zabbix_config():
    """Grava DAEDALUS_ZABBIX_URL e DAEDALUS_ZABBIX_API_TOKEN no .env local (somente deste computador)."""
    origin = request.headers.get("Origin")
    if (origin and urlparse(origin).netloc != request.host) or request.remote_addr not in ("127.0.0.1", "::1"):
        return jsonify(success=False, error="Origem não permitida."), 403
    body = request.get_json(silent=True) or {}
    url = str(body.get("url") or "").strip().rstrip("/")
    token = str(body.get("token") or "").strip()
    try:
        integration_url(url, "/api_jsonrpc.php")
    except ValueError as exc:
        return jsonify(success=False, error=str(exc)), 400
    if token and (len(token) > 512 or re.search(r"[\s\"'#]", token)):
        return jsonify(success=False, error="Token inválido (sem espaços ou aspas)."), 400
    env_path = BASE_DIR / ".env"
    lines = env_path.read_text(encoding="utf-8-sig").splitlines() if env_path.exists() else []
    values = {"DAEDALUS_ZABBIX_URL": url}
    if token:
        values["DAEDALUS_ZABBIX_API_TOKEN"] = token
    kept = [ln for ln in lines if ln.split("=", 1)[0].strip() not in values]
    kept += [f"{k}={v}" for k, v in values.items()]
    env_path.write_text("\n".join(kept) + "\n", encoding="utf-8")
    try:
        os.chmod(env_path, 0o600)
    except OSError:
        pass
    os.environ.update(values)
    audit("integration.zabbix.config", {"host": urlparse(url).hostname, "token_set": bool(token)})
    return jsonify(success=True, configured=integration_status())


@app.route("/api/integrations/zabbix/maps/<map_id>")
def get_zabbix_map(map_id: str):
    if not map_id.isdigit() or len(map_id) > 12:
        return jsonify(success=False, error="ID de mapa Zabbix inválido."), 400
    if not integration_status()["zabbix"]:
        return jsonify(success=False, error="Integração Zabbix não configurada no ambiente local."), 503
    try:
        url = integration_url(os.environ["DAEDALUS_ZABBIX_URL"], "/api_jsonrpc.php")
        answer = integration_request(url, method="POST", payload={
            "jsonrpc": "2.0", "method": "map.get", "params": {
                "sysmapids": [map_id], "output": "extend", "selectSelements": "extend",
                "selectLinks": "extend", "selectShapes": "extend", "selectLines": "extend",
            }, "id": 1,
        }, headers={"Authorization": "Bearer " + os.environ["DAEDALUS_ZABBIX_API_TOKEN"], "Content-Type": "application/json-rpc"})
        if isinstance(answer, dict) and answer.get("error"):
            log.warning("Zabbix API recusou map.get (%s)", answer["error"].get("code", "API error"))
            return jsonify(success=False, error="A API do Zabbix recusou a consulta; verifique token e permissão de leitura de mapas."), 502
        maps_result = answer.get("result") if isinstance(answer, dict) else None
        if not isinstance(maps_result, list) or not maps_result:
            return jsonify(success=False, error="Mapa não encontrado ou sem permissão de leitura."), 404
        audit("integration.zabbix.map.read", {"map_id": map_id})
        return jsonify(success=True, map=maps_result[0])
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        log.warning("Zabbix API indisponível: %s", type(exc).__name__)
        return jsonify(success=False, error="Zabbix: " + (_net_error(exc) if isinstance(exc, OSError) else "resposta inválida da API (confira se a URL termina na pasta do Zabbix, ex.: http://servidor/zabbix).")), 502


@app.route("/api/integrations/zabbix/status", methods=["POST"])
def get_zabbix_host_status():
    """Read current host availability and active problem severity for map elements."""
    if not integration_status()["zabbix"]:
        return jsonify(success=False, error="Integração Zabbix não configurada no ambiente local."), 503
    payload = request.get_json(silent=True) or {}
    host_ids = payload.get("hostids") if isinstance(payload, dict) else None
    if not isinstance(host_ids, list) or not host_ids or len(host_ids) > 500:
        return jsonify(success=False, error="Informe de 1 a 500 IDs de hosts Zabbix."), 400
    normalized = list(dict.fromkeys(str(value) for value in host_ids))
    if any(not value.isdigit() or len(value) > 12 or int(value) < 1 for value in normalized):
        return jsonify(success=False, error="IDs de host Zabbix inválidos."), 400
    token = os.environ["DAEDALUS_ZABBIX_API_TOKEN"]
    url = integration_url(os.environ["DAEDALUS_ZABBIX_URL"], "/api_jsonrpc.php")

    def rpc(method: str, params: dict[str, Any], request_id: int) -> Any:
        answer = integration_request(url, method="POST", payload={
            "jsonrpc": "2.0", "method": method, "params": params, "id": request_id,
        }, headers={"Authorization": "Bearer " + token, "Content-Type": "application/json-rpc"})
        if not isinstance(answer, dict) or answer.get("error"):
            raise ValueError("Zabbix API recusou a consulta de estado.")
        return answer.get("result", [])

    try:
        hosts = rpc("host.get", {"hostids": normalized, "output": ["hostid", "name"],
                                 "selectInterfaces": ["interfaceid", "type", "main", "available", "error"]}, 2)
        problems = rpc("trigger.get", {"hostids": normalized, "output": ["triggerid", "description", "priority"],
                                      "filter": {"value": 1}, "monitored": True,
                                      "selectHosts": ["hostid"]}, 3)
        if not isinstance(hosts, list) or not isinstance(problems, list):
            raise ValueError("Resposta inesperada da API Zabbix.")
        # Unknown is safer than painting an unreturned/unchecked host as online.
        states = {host_id: {"status": "unknown", "problems": []} for host_id in normalized}
        for host in hosts:
            host_id = str(host.get("hostid", ""))
            if host_id not in states:
                continue
            interfaces = host.get("interfaces") if isinstance(host.get("interfaces"), list) else []
            availability = [str(interface.get("available", "0")) for interface in interfaces]
            checked = [state for state in availability if state in {"1", "2"}]
            if "1" in checked:
                states[host_id]["status"] = "ok"
            elif checked and all(state == "2" for state in checked):
                states[host_id]["status"] = "bad"
            else:
                states[host_id]["status"] = "unknown"
        for problem in problems:
            priority = int(problem.get("priority", 0) or 0)
            status = "bad" if priority >= 4 else "warn" if priority >= 2 else None
            for host in problem.get("hosts", []) if isinstance(problem.get("hosts"), list) else []:
                host_id = str(host.get("hostid", ""))
                if host_id not in states:
                    continue
                if status and (status == "bad" or states[host_id]["status"] in {"ok", "unknown"}):
                    states[host_id]["status"] = status
                states[host_id]["problems"].append({"name": str(problem.get("description", "Problema ativo"))[:200], "severity": priority})
        audit("integration.zabbix.status.read", {"host_count": len(normalized)})
        return jsonify(success=True, states=states, updated_at=utc_now())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        log.warning("Zabbix status indisponível: %s", type(exc).__name__)
        return jsonify(success=False, error="Não foi possível atualizar o estado dos hosts no Zabbix. Verifique a API e as permissões do token."), 502


@app.route("/api/integrations/metabase/dashboards/<dashboard_id>")
def get_metabase_dashboard(dashboard_id: str):
    if not dashboard_id.isdigit() or len(dashboard_id) > 12:
        return jsonify(success=False, error="ID de dashboard Metabase inválido."), 400
    if not integration_status()["metabase"]:
        return jsonify(success=False, error="Integração Metabase não configurada no ambiente local."), 503
    try:
        url = integration_url(os.environ["DAEDALUS_METABASE_URL"], "/api/dashboard/" + dashboard_id)
        dashboard = integration_request(url, headers={"X-API-Key": os.environ["DAEDALUS_METABASE_API_KEY"]})
        if not isinstance(dashboard, dict) or dashboard.get("id") is None:
            return jsonify(success=False, error="Resposta inesperada da API do Metabase."), 502
        audit("integration.metabase.dashboard.read", {"dashboard_id": dashboard_id})
        return jsonify(success=True, dashboard=dashboard)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        log.warning("Metabase API indisponível: %s", type(exc).__name__)
        return jsonify(success=False, error="Não foi possível consultar o Metabase. Verifique URL, conexão e permissão da chave API."), 502


@app.route("/api/integrations/metabase/dashboards/<dashboard_id>/cards/<dashcard_id>/<card_id>/query", methods=["POST"])
def query_metabase_card(dashboard_id: str, dashcard_id: str, card_id: str):
    if any(not value.isdigit() or len(value) > 12 for value in (dashboard_id, dashcard_id, card_id)):
        return jsonify(success=False, error="IDs de dashboard/cartão inválidos."), 400
    if not integration_status()["metabase"]:
        return jsonify(success=False, error="Integração Metabase não configurada no ambiente local."), 503
    payload = request.get_json(silent=True) or {}
    parameters = payload.get("parameters", []) if isinstance(payload, dict) else None
    if not isinstance(parameters, list) or len(parameters) > 100:
        return jsonify(success=False, error="parameters precisa ser uma lista de até 100 filtros."), 400
    try:
        endpoint = f"/api/dashboard/{dashboard_id}/dashcard/{dashcard_id}/card/{card_id}/query"
        url = integration_url(os.environ["DAEDALUS_METABASE_URL"], endpoint)
        result = integration_request(url, method="POST", payload={"parameters": parameters}, headers={"X-API-Key": os.environ["DAEDALUS_METABASE_API_KEY"]})
        audit("integration.metabase.card.query", {"dashboard_id": dashboard_id, "card_id": card_id})
        return jsonify(success=True, result=result)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        log.warning("Consulta de cartão Metabase falhou: %s", type(exc).__name__)
        return jsonify(success=False, error="Não foi possível consultar o cartão Metabase; confira a permissão de leitura e os filtros."), 502


@app.route("/api/config", methods=["GET"])
def get_config():
    try:
        return jsonify(success=True, config=load_local_config())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        log.error("Configuração inválida: %s", exc)
        return jsonify(success=False, message=str(exc)), 500


@app.route("/api/audit", methods=["GET"])
def get_audit():
    try:
        limit = max(1, min(int(request.args.get("limit", "100")), 500))
    except ValueError:
        return jsonify(success=False, error="limit precisa ser inteiro."), 400
    with closing(connect_db()) as conn:
        rows = conn.execute("SELECT id,created_at,event,details_json,remote_addr FROM audit_log ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    items = []
    for row in rows:
        item = dict(row)
        try:
            item["details"] = json.loads(item.pop("details_json"))
        except json.JSONDecodeError:
            item["details"] = {}
        items.append(item)
    return jsonify(success=True, items=items)


@app.route("/api/inventory", methods=["GET", "POST"])
def inventory_api():
    if request.method == "GET":
        return jsonify(success=True, items=inventory_repository.list())

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify(success=False, error="Envie um objeto JSON."), 400
    device_id = str(payload.get("id", "")).strip()[:100]
    name = str(payload.get("name", "")).strip()[:200]
    if not device_id or not name:
        return jsonify(success=False, error="Os campos id e name são obrigatórios."), 400
    ip_value = payload.get("ip")
    if ip_value:
        try:
            ip_value = str(ipaddress.ip_address(str(ip_value)))
        except ValueError:
            return jsonify(success=False, error="IP inválido."), 400
    status = str(payload.get("status", "unknown")).lower()
    if status not in {"online", "offline", "warning", "critical", "unknown"}:
        return jsonify(success=False, error="status deve ser online, offline, warning, critical ou unknown."), 400
    metadata = payload.get("metadata", {})
    if not isinstance(metadata, dict):
        return jsonify(success=False, error="metadata precisa ser um objeto."), 400
    try:
        inventory_repository.upsert(InventoryRecord(device_id, name, ip_value,
            str(payload.get("device_type", ""))[:80], str(payload.get("location", ""))[:300],
            status, utc_now(), metadata))
    except ValueError as exc:
        return jsonify(success=False, error=str(exc)), 400
    audit("inventory.upsert", {"id": device_id, "status": status})
    return jsonify(success=True, id=device_id), 201


_vnc_cache: dict[str, dict[str, Any]] = {}
_vnc_locks: dict[str, threading.Lock] = defaultdict(threading.Lock)
_vnc_pool = ThreadPoolExecutor(max_workers=int(os.environ.get("AXIOM_VNC_WORKERS", "4")), thread_name_prefix="vnc")
VNC_TTL = float(os.environ.get("AXIOM_VNC_TTL", "3"))            # frame reaproveitado por N s (vários painéis/abas)
VNC_TIMEOUT = float(os.environ.get("AXIOM_VNC_TIMEOUT", "8"))    # limite por captura
VNC_STALE_MAX = float(os.environ.get("AXIOM_VNC_STALE_MAX", "600"))


def _vnc_capture(target: str, width: int) -> tuple[bytes, str]:
    from vncdotool import api  # import tardio: dependência opcional
    client = api.connect(f"{target}::5900")
    try:
        image = client.screen.convert("RGB")
        if image.width > width:
            image.thumbnail((width, max(1, int(width * 9 / 16 * 1.6))))
        buf = BytesIO()
        image.save(buf, format="JPEG", quality=62, optimize=True)
        data = buf.getvalue()
        return data, __import__("hashlib").md5(data).hexdigest()[:12]
    finally:
        try:
            client.disconnect()
        except Exception:
            log.debug("Falha ao desconectar cliente VNC", exc_info=True)


@app.route("/api/vnc/panels", methods=["GET"])
def vnc_panels():
    """Lista os painéis VNC cadastrados em config.json (somente estes IPs podem ser capturados)."""
    try:
        config = load_local_config()
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return jsonify(success=False, error=str(exc)), 500
    panels = []
    for tab in config.get("tabs", []):
        for panel in tab.get("vnc_panels", []) or []:
            try:
                ip = str(ipaddress.ip_address(panel.get("target_ip", "")))
            except ValueError:
                continue
            panels.append({
                "tab": tab.get("id"), "ip": ip,
                "name": str(panel.get("name") or panel.get("label") or ip)[:60],
                "floor": str(panel.get("floor") or panel.get("andar") or tab.get("name") or tab.get("id") or "")[:40],
                "block": str(panel.get("block") or panel.get("bloco") or "")[:40],
                "interval": panel.get("refresh_interval_seconds", 5),
            })
    return jsonify(success=True, panels=panels, ttl=VNC_TTL)


@app.route("/api/snapshot/<ip>", methods=["GET"])
def get_vnc_snapshot(ip: str):
    """Captura VNC somente para IP explicitamente cadastrado na configuração.

    Melhorias de fluidez: cache curto compartilhado, uma captura por IP por vez, miniatura,
    hash (?h=) para não reenviar frame idêntico, frame antigo marcado como `stale` quando o
    painel cai e backoff para não travar threads em máquinas offline.
    """
    try:
        target = str(ipaddress.ip_address(ip))
        config = load_local_config()
        if target not in configured_vnc_ips(config):
            audit("vnc.snapshot.denied", {"ip": target, "reason": "not_allowlisted"})
            return jsonify(success=False, error="IP não cadastrado na lista de painéis VNC permitidos."), 403
    except ValueError:
        return jsonify(success=False, error="Endereço IP inválido."), 400
    except (OSError, json.JSONDecodeError) as exc:
        return jsonify(success=False, error=f"Não foi possível carregar a configuração: {exc}"), 500

    try:
        width = max(320, min(1920, int(request.args.get("w", "960"))))
    except ValueError:
        width = 960
    known = request.args.get("h", "")
    now = time.monotonic()

    def reply(entry: dict[str, Any], **extra):
        age = round(now - entry["mono"], 1) if entry.get("mono") else None
        if known and entry.get("hash") == known:
            return jsonify(success=True, unchanged=True, hash=entry["hash"], age=age, timestamp=entry.get("ts"), **extra)
        return jsonify(success=True, image=entry["image"], content_type="image/jpeg", hash=entry["hash"],
                       age=age, timestamp=entry.get("ts"), **extra)

    with _vnc_locks[target]:
        entry = _vnc_cache.get(target, {})
        now = time.monotonic()
        if entry.get("image") and now - entry["mono"] < VNC_TTL:
            return reply(entry, cached=True)
        if entry.get("retry_at", 0) > now:                       # backoff após falha
            if entry.get("image") and now - entry["mono"] < VNC_STALE_MAX:
                return reply(entry, stale=True, error=entry.get("error"))
            return jsonify(success=False, error=entry.get("error", "Painel VNC offline."), retry_in=round(entry["retry_at"] - now, 1)), 502
        try:
            future = _vnc_pool.submit(_vnc_capture, target, width)
            data, digest = future.result(timeout=VNC_TIMEOUT)
            entry = {"image": base64.b64encode(data).decode("ascii"), "hash": digest, "mono": time.monotonic(),
                     "ts": utc_now(), "fails": 0}
            _vnc_cache[target] = entry
            now = time.monotonic()
            audit("vnc.snapshot.ok", {"ip": target, "bytes": len(data)})
            return reply(entry)
        except ImportError:
            audit("vnc.snapshot.mock", {"ip": target, "reason": "dependency_missing"})
            return jsonify(success=False, mock=True, error="vncdotool não está instalado; nenhuma captura real foi feita."), 503
        except Exception as exc:
            fails = int(entry.get("fails", 0)) + 1
            message = "Painel VNC offline ou inacessível."
            entry = dict(entry, fails=fails, error=message, retry_at=time.monotonic() + min(5 * 2 ** (fails - 1), 60))
            _vnc_cache[target] = entry
            log.warning("Snapshot VNC falhou para %s (%s): %s", target, fails, exc)
            audit("vnc.snapshot.failed", {"ip": target, "error_type": type(exc).__name__, "fails": fails})
            now = time.monotonic()
            if entry.get("image") and now - entry["mono"] < VNC_STALE_MAX:
                return reply(entry, stale=True, error=message)
            return jsonify(success=False, error=message, detail=str(exc)[:300]), 502



# ---------- Biblioteca de ferramentas (bibliotecas JS opcionais, baixadas sob demanda) ----------
VENDOR_DIR = BASE_DIR / "vendor"
VENDOR_CATALOG = {
    "dagre": {"name": "Dagre", "file": "dagre.min.js", "version": "0.8.5", "global": "dagre",
              "url": "https://cdnjs.cloudflare.com/ajax/libs/dagre/0.8.5/dagre.min.js",
              "use": "Organização hierárquica automática da topologia (menos cruzamento de linhas)."},
    "pptxgenjs": {"name": "PptxGenJS", "file": "pptxgen.bundle.js", "version": "3.12.0", "global": "PptxGenJS",
                  "url": "https://cdnjs.cloudflare.com/ajax/libs/pptxgenjs/3.12.0/pptxgen.bundle.js",
                  "use": "Exportar as telas para PowerPoint (.pptx)."},
    "xlsx": {"name": "SheetJS", "file": "xlsx.full.min.js", "version": "0.18.5", "global": "XLSX",
             "url": "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
             "use": "Importar e exportar planilhas Excel (.xlsx)."},
    "papaparse": {"name": "PapaParse", "file": "papaparse.min.js", "version": "5.4.1", "global": "Papa",
                  "url": "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js",
                  "use": "Importar CSV com aspas, ponto e vírgula e arquivos grandes."},
}
VENDOR_MAX = 9 * 1024 * 1024


def _vendor_state(lib_id: str) -> dict[str, Any]:
    lib = VENDOR_CATALOG[lib_id]
    path = VENDOR_DIR / lib["file"]
    return {"id": lib_id, "name": lib["name"], "version": lib["version"], "use": lib["use"], "global": lib["global"],
            "file": lib["file"], "url": lib["url"], "installed": path.is_file(), "bytes": path.stat().st_size if path.is_file() else 0}


@app.route("/api/vendor/catalog", methods=["GET"])
def vendor_catalog():
    return jsonify(success=True, libs=[_vendor_state(k) for k in VENDOR_CATALOG])


@app.route("/api/vendor/install", methods=["POST"])
def vendor_install():
    origin = request.headers.get("Origin")
    if origin and urlparse(origin).netloc != request.host:
        return jsonify(success=False, error="Origem não permitida."), 403
    body = request.get_json(silent=True) or {}
    lib_id = body.get("id")
    if lib_id not in VENDOR_CATALOG:
        return jsonify(success=False, error="Biblioteca desconhecida."), 400
    lib = VENDOR_CATALOG[lib_id]
    try:
        with urlopen(Request(lib["url"], headers={"User-Agent": "AxiomStudio"}), timeout=20) as response:  # noqa: S310
            data = response.read(VENDOR_MAX + 1)
    except Exception as exc:
        audit("vendor.install.failed", {"id": lib_id, "error_type": type(exc).__name__})
        return jsonify(success=False, error="Sem acesso ao servidor da biblioteca (verifique a internet deste computador).", detail=str(exc)[:200]), 502
    if len(data) > VENDOR_MAX or len(data) < 500 or data.lstrip()[:1] == b"<":
        return jsonify(success=False, error="Arquivo recebido não parece uma biblioteca JavaScript válida."), 502
    try:
        VENDOR_DIR.mkdir(parents=True, exist_ok=True)
        target = VENDOR_DIR / lib["file"]
        tmp = target.with_suffix(".tmp")
        tmp.write_bytes(data)
        tmp.replace(target)
    except OSError as exc:
        return jsonify(success=False, error=f"Não foi possível gravar: {exc}"), 500
    audit("vendor.install.ok", {"id": lib_id, "bytes": len(data)})
    return jsonify(success=True, **_vendor_state(lib_id))


@app.route("/vendor/<path:name>")
def vendor_file(name: str):
    allowed = {lib["file"] for lib in VENDOR_CATALOG.values()}
    if name not in allowed or not (VENDOR_DIR / name).is_file():
        return jsonify(success=False, error="Biblioteca não instalada."), 404
    response = send_file(VENDOR_DIR / name, mimetype="application/javascript")
    response.headers["Cache-Control"] = "public, max-age=86400"
    return response


# ---------- HeartPulse NOC: arquivo final gerado pelo sistema ----------
PLAYER_BOOT_JS = r"""(function(){var P=window.AX_PLAYER;if(!P)return;var pr=P.project||{},ov={};
ov['noc_studio_v2']=JSON.stringify({maps:pr.maps||[],cur:0,evlog:[],t0:Date.now(),auditLog:[],carouselSettings:pr.carouselSettings||{}});
ov['daedalus_carousel_settings']=JSON.stringify(pr.carouselSettings||{});
ov['daedalus_bi_widgets']=JSON.stringify(pr.biWidgets||[]);
ov['ax_welcome_v1']='off';ov['ax_ui_mode_v1']='adv';
var gi=Storage.prototype.getItem,si=Storage.prototype.setItem,ri=Storage.prototype.removeItem;
var own=/^(noc_studio|daedalus_|ax_backups|ax_fileauto|ax_page|ax_ui_mode|ax_welcome|ax_tour)/;
Storage.prototype.getItem=function(k){return(this===window.localStorage&&Object.prototype.hasOwnProperty.call(ov,k))?ov[k]:gi.call(this,k)};
Storage.prototype.setItem=function(k,v){if(this===window.localStorage&&own.test(k)){ov[k]=String(v);return}return si.call(this,k,v)};
Storage.prototype.removeItem=function(k){if(this===window.localStorage&&own.test(k)){delete ov[k];return}return ri.call(this,k)};
document.documentElement.classList.add('ax-player-boot');
setTimeout(function(){document.documentElement.classList.remove('ax-player-boot')},6000);
})();"""


HEARTPULSE_NAME = "HeartPulse_NOC.html"
_CDN_ALLOWED = ("https://cdnjs.cloudflare.com/",)


def _js_json(value: Any) -> str:
    text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return text.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def _vendor_script(url: str) -> str | None:
    """Baixa (e guarda em dist/vendor) bibliotecas dos CDNs conhecidos para o arquivo final funcionar offline."""
    if not url.startswith(_CDN_ALLOWED):
        return None
    cache = BASE_DIR / "dist" / "vendor" / re.sub(r"[^A-Za-z0-9._-]", "_", url.split("/ajax/libs/")[-1])
    try:
        if cache.is_file():
            return cache.read_text(encoding="utf-8")
        with urlopen(Request(url, headers={"User-Agent": "AxiomStudio"}), timeout=10) as response:  # noqa: S310
            data = response.read(6 * 1024 * 1024 + 1)
        if len(data) > 6 * 1024 * 1024:
            return None
        text = data.decode("utf-8")
        cache.parent.mkdir(parents=True, exist_ok=True)
        cache.write_text(text, encoding="utf-8")
        return text
    except Exception as exc:  # sem internet: mantém a tag com CDN
        log.info("Não foi possível embutir %s: %s", url, exc)
        return None


def build_heartpulse(project: dict[str, Any], name: str, inline_libs: bool = True) -> tuple[str, dict[str, Any]]:
    html_path = BASE_DIR / "Daedalus_Core_NOC_v8.html"
    html = html_path.read_text(encoding="utf-8")
    report = {"inlined": [], "cdn": []}
    payload = {
        "name": name, "built": utc_now(), "api": request.host_url.rstrip("/"),
        "project": project,
    }
    html = html.replace("<head>", "<head>\n<script>window.AX_PLAYER=" + _js_json(payload) + ";</script>\n<script>" + PLAYER_BOOT_JS + "</script>", 1)
    html = re.sub(r"<title>.*?</title>", lambda _m: "<title>" + name.replace("<", "") + "</title>", html, count=1, flags=re.S)

    def inline(match: re.Match) -> str:
        src = match.group(1)
        if src.startswith("web-studio.js"):
            code = (BASE_DIR / "web-studio.js").read_text(encoding="utf-8")
            report["inlined"].append("web-studio.js")
        elif inline_libs and (code := _vendor_script(src)) is not None:
            report["inlined"].append(src.rsplit("/", 1)[-1])
        else:
            if src.startswith("http"):
                report["cdn"].append(src)
            return match.group(0)
        return "<script>" + code.replace("</script", "<\\/script") + "</script>"

    html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
    return html, report


@app.route("/api/export/heartpulse", methods=["POST"])
def export_heartpulse():
    origin = request.headers.get("Origin")
    if origin and urlparse(origin).netloc != request.host:
        return jsonify(success=False, error="Origem não permitida."), 403
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get("project"), dict) or not isinstance(body["project"].get("maps"), list):
        return jsonify(success=False, error="Envie {project:{maps:[...]}} em JSON."), 400
    name = re.sub(r"[\r\n<>]", " ", str(body.get("name") or "HeartPulse NOC")).strip()[:60] or "HeartPulse NOC"
    try:
        html, report = build_heartpulse(body["project"], name, bool(body.get("inline", True)))
        out = BASE_DIR / "dist" / HEARTPULSE_NAME
        out.parent.mkdir(parents=True, exist_ok=True)
        tmp = out.with_suffix(".tmp")
        tmp.write_text(html, encoding="utf-8")
        tmp.replace(out)
    except OSError as exc:
        log.exception("Falha ao gerar HeartPulse")
        return jsonify(success=False, error=f"Não foi possível gravar o arquivo: {exc}"), 500
    audit("export.heartpulse", {"bytes": len(html), "maps": len(body["project"]["maps"]), "cdn": len(report["cdn"])})
    return jsonify(success=True, path=str(out), bytes=len(html), url=request.host_url.rstrip("/") + "/heartpulse",
                   inlined=report["inlined"], cdn=report["cdn"], built=utc_now())

@app.route("/api/export/pptx", methods=["POST"])
def export_pptx():
    """PowerPoint nativo e editável (python-pptx): um slide por tela, equipamentos como formas e cabos como conectores."""
    origin = request.headers.get("Origin")
    if origin and urlparse(origin).netloc != request.host:
        return jsonify(success=False, error="Origem não permitida."), 403
    try:
        from pptx import Presentation
        from pptx.util import Inches, Pt
        from pptx.dml.color import RGBColor
        from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
    except ImportError:
        return jsonify(success=False, error="Instale python-pptx (pip install python-pptx)."), 501
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get("maps"), list):
        return jsonify(success=False, error="Envie {maps:[...]} em JSON."), 400
    import io
    prs = Presentation()
    prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    blank = prs.slide_layouts[6]
    cores = {"ok": "2EA043", "warn": "D29922", "bad": "F85149"}
    def rgb(h):
        return RGBColor.from_string(h)
    def txt(sl, x, y, w, h, t, size, color, bold=False):
        tb = sl.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tf = tb.text_frame; tf.word_wrap = True
        r = tf.paragraphs[0].add_run(); r.text = str(t)[:300]; r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = rgb(color)
    total = 0
    for m in body["maps"][:60]:
        if not isinstance(m, dict):
            continue
        sl = prs.slides.add_slide(blank)
        sl.background.fill.solid(); sl.background.fill.fore_color.rgb = rgb("111827")
        nodes = [n for n in (m.get("nodes") or [])[:600] if isinstance(n, dict) and isinstance(n.get("x"), (int, float)) and isinstance(n.get("y"), (int, float))]
        txt(sl, .4, .2, 12.5, .5, m.get("name") or "Tela", 22, "FFFFFF", True)
        bad = sum(1 for n in nodes if n.get("status") == "bad"); warn = sum(1 for n in nodes if n.get("status") == "warn")
        txt(sl, .4, .72, 12.5, .3, f"{len(nodes)} itens · {warn} em alerta · {bad} fora do ar", 11, "9CA3AF")
        if not nodes:
            continue
        xs = [n["x"] for n in nodes]; ys = [n["y"] for n in nodes]
        minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
        W, H, X0, Y0 = 12.0, 5.7, .65, 1.2
        sc = min(W / max(maxx - minx, 1), H / max(maxy - miny, 1), 3.0)
        ox = X0 + (W - (maxx - minx) * sc) / 2; oy = Y0 + (H - (maxy - miny) * sc) / 2
        pos = {n.get("id"): (ox + (n["x"] - minx) * sc, oy + (n["y"] - miny) * sc) for n in nodes}
        for e in (m.get("edges") or [])[:1500]:
            if isinstance(e, dict) and e.get("from") in pos and e.get("to") in pos:
                a, b = pos[e["from"]], pos[e["to"]]
                c = sl.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(a[0]), Inches(a[1]), Inches(b[0]), Inches(b[1]))
                c.line.color.rgb = rgb("6B7280"); c.line.width = Pt(1.25)
        bw, bh = .95, .42
        for n in nodes:
            x, y = pos[n.get("id")]
            sh = sl.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x - bw / 2), Inches(y - bh / 2), Inches(bw), Inches(bh))
            sh.fill.solid(); sh.fill.fore_color.rgb = rgb(cores.get(n.get("status"), cores["ok"]))
            sh.line.color.rgb = rgb("111827"); sh.name = str(n.get("label") or n.get("id"))[:60]
            tf = sh.text_frame; tf.word_wrap = True
            r = tf.paragraphs[0].add_run(); r.text = str(n.get("label") or "")[:24]; r.font.size = Pt(8); r.font.bold = True; r.font.color.rgb = rgb("FFFFFF")
            total += 1
        sl.notes_slide.notes_text_frame.text = "\n".join(f"{n.get('label')} ({n.get('ip') or '-'}) - {n.get('status') or 'ok'}" for n in nodes if n.get("label"))[:8000]
    buf = io.BytesIO(); prs.save(buf); buf.seek(0)
    audit("export.pptx", {"slides": len(prs.slides), "shapes": total})
    return send_file(buf, mimetype="application/vnd.openxmlformats-officedocument.presentationml.presentation",
                     as_attachment=True, download_name="Axiom_Studio_telas.pptx")


@app.route("/heartpulse")
def heartpulse_final():
    out = BASE_DIR / "dist" / HEARTPULSE_NAME
    if not out.is_file():
        return jsonify(success=False, error="Ainda não foi gerado. No Axiom Studio use Arquivo > Gerar HeartPulse NOC."), 404
    return send_file(out, mimetype="text/html")


@app.route("/api/export/heartpulse", methods=["GET"])
def heartpulse_info():
    out = BASE_DIR / "dist" / HEARTPULSE_NAME
    if not out.is_file():
        return jsonify(success=True, exists=False)
    stat = out.stat()
    return jsonify(success=True, exists=True, path=str(out), bytes=stat.st_size,
                   modified=datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat())


@app.route("/mock-glpi", methods=["GET"])
def mock_glpi():
    """Dados demonstrativos; não é uma integração real com o GLPI."""
    return jsonify(success=True, mock=True, status="online", total_tickets=14, critical_tickets=3, department="Suporte Corporativo TI", note="Dados fictícios para demonstração; configure a API oficial do GLPI para dados reais.")


@app.route("/api/config/reload", methods=["POST"])
def reload_config():
    """Valida a configuração atual e registra a ação; não altera o arquivo em disco."""
    try:
        config = load_local_config()
        audit("config.reload", {"tabs": len(config.get("tabs", []))})
        return jsonify(success=True, config=config)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        return jsonify(success=False, error=str(exc)), 500


# Versioned aliases preserve existing /api routes and their payloads.
for rule in list(app.url_map.iter_rules()):
    if rule.rule.startswith('/api/'):
        app.add_url_rule('/api/v1/' + rule.rule[5:], endpoint='v1_' + rule.endpoint,
                         view_func=app.view_functions[rule.endpoint], methods=sorted(rule.methods - {'HEAD', 'OPTIONS'}))


def bootstrap() -> None:
    load_local_config()
    for filename in ('Daedalus_Core_NOC_v8.html', 'web-studio.js'):
        if not (BASE_DIR / filename).is_file():
            raise ValueError('Arquivo obrigatório ausente: ' + filename)
    for prefix in ('ZABBIX', 'METABASE', 'GLPI'):
        url = os.environ.get('DAEDALUS_' + prefix + '_URL', '').strip()
        if url:
            integration_url(url, '')
    init_db()


def main() -> None:
    bootstrap()
    log.info("Inicializando %s em http://%s:%s", APP_NAME, HOST, PORT)
    if SETTINGS.server == 'development':
        app.run(host=HOST, port=PORT, debug=False, use_reloader=False, threaded=True)
        return
    try:
        from backend.server import serve_local
    except ImportError:
        raise SystemExit('Instale as dependências: python -m pip install -r requirements.txt') from None
    try:
        serve_local(app, host=HOST, port=PORT, threads=SETTINGS.threads)
    finally:
        with closing(connect_db()) as conn:
            conn.execute('PRAGMA wal_checkpoint(PASSIVE)')
        log.info('Servidor encerrado; checkpoint do banco concluído.')


if __name__ == "__main__":
    main()
