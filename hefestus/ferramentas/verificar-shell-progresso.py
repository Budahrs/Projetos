"""Verificação opcional do DOM do Shell (Chrome headless, cofre inteiramente sintético)."""
import argparse
import json
import subprocess
import tempfile
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs


class Fixture(SimpleHTTPRequestHandler):
    def responder(self, corpo, tipo):
        self.send_response(200)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def do_GET(self):
        caminho = urlsplit(self.path).path
        if caminho == "/boot":
            prefs = {"shellLayout:l-seed": 1, "areaAtiva": "projetos", "aba": "progresso", "temaUI": "automatico"}
            query = parse_qs(urlsplit(self.path).query)
            if query.get("continuidade") == ["1"]:
                prefs["aba"] = "continuidade"
            if query.get("modulos") == ["1"]:
                prefs["itens"] = {"projetos/progresso": "prj-hefestus"}
            self.responder((f'<script>localStorage.setItem("hefestus.shell.l-seed",JSON.stringify({json.dumps(prefs)}));location.href="/shell/l-seed.html";</script>').encode(), "text/html")
        elif caminho == "/api/estado":
            self.responder(b'{"modelos":[],"ollama":false}', "application/json")
        elif caminho == "/api/conversas":
            self.responder(b'{"conversas":[]}', "application/json")
        elif caminho == "/api/painel":
            if parse_qs(urlsplit(self.path).query).get("aba") == ["continuidade"]:
                self.responder(json.dumps({"texto":"Tarefas (do principal)\nAtivas: 1\nCristais (estado persistido)\nPropostos: 2\nNúcleos lógicos: 1", "aviso":"Snapshot de continuidade; não é homologação."}).encode(), "application/json")
                return
            modulo = parse_qs(urlsplit(self.path).query).get("item") == ["prj-hefestus"]
            self.responder(json.dumps({"itens": ["todos", "prj-hefestus"], "item": "prj-hefestus" if modulo else "todos",
                "evidencias": [{"nome": "js/nucleo" if modulo else "Hephaestus Fixture", "arquivos": None if modulo else 506,
                "capacidades": 319, "arquivos_de_teste": 79, "hdb_capacidades": 1, "hdb_registradas": 2,
                "hdb_correspondentes": 1, "hdb_divergentes": 0, "progresso_percentual": None}],
                "aviso": "Contagens não são percentual.", "texto": ""}).encode(), "application/json")
        else:
            super().do_GET()

    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chrome", required=True, type=Path)
    parser.add_argument("--modulos", action="store_true")
    parser.add_argument("--continuidade", action="store_true")
    args = parser.parse_args()
    pasta = Path(__file__).resolve().parent.parent
    srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(Fixture, directory=str(pasta)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        with tempfile.TemporaryDirectory(prefix="lseed-ui-") as perfil:
            r = subprocess.run([str(args.chrome), "--headless=new", "--disable-gpu", "--disable-background-networking",
                "--no-first-run", f"--user-data-dir={perfil}", "--dump-dom", "--virtual-time-budget=7000",
                f"http://127.0.0.1:{srv.server_port}/boot" + ("?continuidade=1" if args.continuidade else "?modulos=1" if args.modulos else "")], capture_output=True, timeout=50, check=True)
            dom = r.stdout.decode("utf-8", errors="replace")
            esperados = ("Ativas: 1", "Propostos: 2", "Núcleos lógicos: 1", "Snapshot de continuidade", "memoria-brs3", "Memória BRS3 local") if args.continuidade else (("js/nucleo" if args.modulos else "Hephaestus Fixture"), ("Módulo" if args.modulos else "Projeto"), "Evidências por projeto", "Não mensurado", "Cap. HDB", "Refs. HDB")
            for esperado in esperados:
                if esperado not in dom:
                    raise AssertionError(f"Tabela não exibiu: {esperado}")
            print("Painel de continuidade renderizado: OK" if args.continuidade else "Tabela de evidências renderizada: OK")
    finally:
        srv.shutdown()
        srv.server_close()


if __name__ == "__main__":
    main()
