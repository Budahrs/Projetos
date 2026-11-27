"""Bounded URL reads for editable HTML and public JSON widgets.

Remote credentials and browser cookies are never copied. LAN services must be
listed in DAEDALUS_WEB_ALLOWED_HOSTS or already configured integrations.
"""
from __future__ import annotations

import ipaddress
import os
import re
import socket
from urllib.parse import parse_qs, urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener
from backend.settings import Settings

MAX_BYTES = 2_000_000


class WebImportError(ValueError):
    pass


ZABBIX_MAP_RE = re.compile(r"(?:zabbix\.php|map\.php)", re.I)


def zabbix_map_info(url: str) -> dict | None:
    """Reconhece links de mapa do Zabbix (zabbix.php?action=map.view&sysmapid=N ou map.php?sysmapid=N)."""
    try:
        parsed = urlparse(url)
        query = parse_qs(parsed.query)
    except ValueError:
        return None
    ids = query.get("sysmapid") or []
    if not ids or not ids[0].isdigit() or not ZABBIX_MAP_RE.search(parsed.path):
        return None
    marker = re.search(r"/(zabbix\.php|map\.php|index\.php)", parsed.path, re.I)
    base_path = parsed.path[:marker.start()] if marker else ""
    return {"map_id": ids[0], "base_url": f"{parsed.scheme}://{parsed.netloc}{base_path}"}


def looks_like_login(html: str) -> bool:
    head = html[:6000].lower()
    return ("name=\"password\"" in head or "type=\"password\"" in head) and ("zabbix" in head or "login" in head or "entrar" in head)


def allowed_lan_hosts() -> set[str]:
    hosts = {x.strip().lower() for x in os.environ.get("DAEDALUS_WEB_ALLOWED_HOSTS", "").split(",") if x.strip()}
    for key in ("DAEDALUS_ZABBIX_URL", "DAEDALUS_METABASE_URL", "DAEDALUS_GLPI_URL"):
        host = urlparse(os.environ.get(key, "")).hostname
        if host:
            hosts.add(host.lower())
    return hosts


def validate_target(url: str) -> str:
    if not isinstance(url, str) or len(url) > 8192:
        raise WebImportError("URL inválida ou maior que 8192 caracteres.")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise WebImportError("Use uma URL HTTP/HTTPS sem senha no endereço.")
    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        addresses = {ipaddress.ip_address(item[4][0]) for item in socket.getaddrinfo(parsed.hostname, port, type=socket.SOCK_STREAM)}
    except (ValueError, OSError) as exc:
        raise WebImportError("Não foi possível resolver o endereço do serviço.") from exc
    permitted = parsed.hostname.lower() in allowed_lan_hosts()
    for address in addresses:
        if address.is_loopback or address.is_link_local or address.is_multicast or address.is_unspecified:
            raise WebImportError("Endereços locais, link-local e de metadados não são permitidos.")
        if not address.is_global and not permitted and os.environ.get("DAEDALUS_WEB_BLOCK_PRIVATE", "").strip() in {"1", "true", "sim"}:
            raise WebImportError("Modo restrito: cadastre o host em DAEDALUS_WEB_ALLOWED_HOSTS e reinicie o servidor.")
    return url


class CheckedRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validate_target(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch_document(url: str, kind: str = "html") -> dict:
    validate_target(url)
    accept = "application/json" if kind == "json" else "text/html,application/xhtml+xml"
    req = Request(url, headers={"Accept": accept, "User-Agent": "Daedalus-Web-Import/1.0", "Accept-Encoding": "identity"})
    with build_opener(CheckedRedirect()).open(req, timeout=Settings.from_environment().timeout) as response:
        mime = response.headers.get_content_type()
        allowed = {"application/json", "text/json"} if kind == "json" else {"text/html", "application/xhtml+xml"}
        if mime not in allowed:
            raise WebImportError("O endereço não retornou " + ("JSON." if kind == "json" else "uma página HTML."))
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise WebImportError("Documento maior que o limite de 2 MB.")
        encoding = response.headers.get_content_charset() or "utf-8"
        try:
            content = raw.decode(encoding, errors="replace")
        except LookupError:
            content = raw.decode("utf-8", errors="replace")
        return {"content": content, "url": response.geturl(), "content_type": mime,
                "bytes": len(raw), "frame_options": response.headers.get("X-Frame-Options", ""),
                "content_security_policy": response.headers.get("Content-Security-Policy", "")}


def probe_document(url: str) -> dict:
    """Read one URL once and classify it for the universal Axiom URL field.

    The response is bounded by the same SSRF and size rules used by the explicit
    import endpoint. HTML and JSON are returned for editing; media and unknown
    content remain live URLs so the browser can render them when allowed.
    """
    validate_target(url)
    zbx = zabbix_map_info(url)
    if zbx:
        return {"url": url, "kind": "zabbix-map", "content_type": "zabbix/map", **zbx}
    request = Request(
        url,
        headers={
            "Accept": "text/html,application/xhtml+xml,application/json,text/json,image/*,video/*;q=.8,*/*;q=.2",
            "User-Agent": "Axiom-Studio-URL/1.0",
            "Accept-Encoding": "identity",
        },
    )
    with build_opener(CheckedRedirect()).open(request, timeout=Settings.from_environment().timeout) as response:
        mime = response.headers.get_content_type().lower()
        result = {
            "url": response.geturl(),
            "content_type": mime,
            "frame_options": response.headers.get("X-Frame-Options", ""),
            "content_security_policy": response.headers.get("Content-Security-Policy", ""),
        }
        if mime in {"application/json", "text/json"} or mime.endswith("+json"):
            raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise WebImportError("Documento maior que o limite de 2 MB.")
            encoding = response.headers.get_content_charset() or "utf-8"
            try:
                content = raw.decode(encoding, errors="replace")
            except LookupError:
                content = raw.decode("utf-8", errors="replace")
            try:
                result.update(kind="json", data=__import__("json").loads(content), bytes=len(raw))
            except ValueError as exc:
                raise WebImportError("O endereço declarou JSON, mas retornou dados inválidos.") from exc
            return result
        if mime in {"text/html", "application/xhtml+xml"}:
            raw = response.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise WebImportError("Documento maior que o limite de 2 MB.")
            encoding = response.headers.get_content_charset() or "utf-8"
            try:
                content = raw.decode(encoding, errors="replace")
            except LookupError:
                content = raw.decode("utf-8", errors="replace")
            if looks_like_login(content):
                result.update(kind="login", bytes=len(raw), message="O endereço pediu login. Páginas protegidas não podem ser lidas sem credenciais: use um conector (Zabbix: token de API) ou uma URL pública.")
                return result
            result.update(kind="html", html=content, bytes=len(raw))
            return result
        if mime.startswith("image/"):
            result["kind"] = "image"
        elif mime.startswith("video/") or mime in {"application/vnd.apple.mpegurl", "application/x-mpegurl"}:
            result["kind"] = "video"
        else:
            result["kind"] = "live"
        return result
