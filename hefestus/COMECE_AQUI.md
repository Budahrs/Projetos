# Comece aqui — usar o Hefestus a partir do Git

Guia para quem **não** tem o ambiente do dono (sem `D:\L-SEED`, sem L-SEED, sem BRS3).
Tudo abaixo foi conferido numa cópia limpa contendo só a pasta `hefestus/` (27/11/2026, Node 22.23, Linux).

## 1. O que você precisa ter

| Para… | Precisa de | Obrigatório? |
| --- | --- | --- |
| Editor no navegador, CLI, MCP, testes | **Git**, **Node.js 22 ou mais novo** (o CI usa 24) e npm | Sim |
| Gerar a janela própria e o instalador (`exportar-programa` → `npm run instalador`) | **Rust** (rustup) e os [pré-requisitos do Tauri 2](https://v2.tauri.app/start/prerequisites/) do seu sistema (Windows: WebView2 + Build Tools do MSVC; Linux: webkit2gtk) | Só para instalador |
| Android | Android Studio, `ANDROID_HOME`, `NDK_HOME`, `JAVA_HOME` (ver `npm run android:preparar`) | Opcional |
| Regenerar a voz da abertura | Windows + PowerShell (voz Microsoft Daniel) | Opcional; a voz já vem pronta |
| Perfil L-SEED do App Shell | A Central L-SEED (Python) rodando localmente | Opcional; **é a parte privada**, o resto funciona sem ela |

Não há chaves de API nem `.env` necessários.

## 2. Obter o código

Esta é a cópia pública do Hefestus (sem o restante do acervo do dono).

```bash
git clone <endereço-deste-repositório> hefestus
```


## 3. Instalar, gerar e abrir

```bash
cd hefestus
```

```bash
npm ci
```

```bash
npm run build
```

Abra `hephaestus.html` no navegador (duplo clique). É o editor completo: Designer + Visual Script.
O projeto em edição fica salvo no navegador (IndexedDB) daquela máquina.

## 4. Conferir que está tudo certo

```bash
npm test
```

Resultado esperado: **424 passam, 1 é pulado, 0 falham**. O pulado (`contrato-acervo.test.mjs`) confere a integração com o Orquestrador do acervo completo do mantenedor, que não faz parte desta cópia. O perfil L-SEED também só é conferido quando a pasta `l-seed/` existe.

- Se `dist.test.mjs` falhar com `ENOENT dist/hefestus.html`, faltou rodar `npm run build` antes.

## 5. Construir um programa pelo terminal (CLI)

Todos os comandos: `npm run cli` sem argumentos. Exemplo testado:

```bash
npm run cli -- novo demo.hefestus --nome "Demo"
```

Crie `passos.json`:

```json
[
  {"ferramenta":"criar_elemento","args":{"tipo":"botao","x":40,"y":40,"largura":160,"altura":44,"propriedades":{"rotulo":"Olá"}}},
  {"ferramenta":"criar_elemento","args":{"tipo":"texto","x":40,"y":110,"propriedades":{"texto":"Feito com Hefestus"}}}
]
```

```bash
npm run cli -- lote demo.hefestus passos.json
```

```bash
npm run cli -- resumo demo.hefestus
```

```bash
npm run cli -- html demo.hefestus demo.html
```

```bash
npm run cli -- ligacoes demo.hefestus
```

```bash
npm run cli -- exportar-programa demo.hefestus --nome demo
```

O último gera `programas/demo/` (projeto Tauri com `LEIA-ME.md` e `LIGACOES.md`). Para o instalador, com Rust instalado:

```bash
cd programas/demo && npm install && npm run instalador
```

Outros comandos úteis: `descrever` (ferramentas e contratos), `modelos` (peças prontas), `executar` (um passo), `importar` (componente da Biblioteca).

`ligacoes` mostra o que cada botão faz. **Pendente** significa que a interface existe, mas nenhuma operação está ligada a ela ainda:
escreva `ligacoes/<programa>.json` ou um motor com a operação de mesmo nome.

## 6. Usar com uma IA (MCP)

O servidor é `ferramentas/hefestus-mcp.mjs`; o segundo argumento é a pasta onde ele pode ler e gravar projetos.
Troque `/caminho/para` pelo seu caminho.

Claude Code / Claude Desktop (`mcpServers`):

```json
"hefestus": {
  "command": "node",
  "args": ["/caminho/para/programas/hefestus/ferramentas/hefestus-mcp.mjs",
           "/caminho/para/programas/hefestus/projetos"]
}
```

Codex CLI (`~/.codex/config.toml`):

```toml
[mcp_servers.hefestus]
command = "node"
args = ['/caminho/para/programas/hefestus/ferramentas/hefestus-mcp.mjs', '/caminho/para/programas/hefestus/projetos']
```

A IA deve ler [AGENTS.md](AGENTS.md) (manual de uso das ferramentas) antes de construir.

## 7. O que fica de fora (privado) e o efeito disso

| Parte privada | Onde é usada | Sem ela |
| --- | --- | --- |
| `l-seed/`, Central L-SEED, Ollama, cofre | Perfil L-SEED do App Shell (`js/shell/*Lseed*`, `perfis/l-seed.perfil.json`) | O perfil L-SEED não conecta; Designer, Visual Script, CLI, MCP e exportação funcionam |
| `brs3/`, HDB completo | Governança e memória do ecossistema | Nada do Hefestus depende disso para rodar |
| Código original do PDF Studio (`../PDF-Studio`) | Só `npm run banco:atualizar` | Use o banco já incluído (`banco/ferramentas.hefestus.json`, 300 registros); não regenere |
| Chaves Android (`~/.chaves-android`) | APK assinado | Gere as suas |
| `D:\L-SEED` e caminhos Windows citados em LEIA-MEs antigos | Histórico de versões | Ignore; use os caminhos da sua cópia |

## 8. Licença e contribuição

Apache 2.0 ([LICENSE](LICENSE), [NOTICE](NOTICE)). Para contribuir, veja o [CONTRIBUTING.md](../CONTRIBUTING.md) na raiz do repositório: commits assinados com DCO (`git commit -s`).

## Estado

- **Testado** nesta cópia limpa: `npm ci`, `npm run build`, `npm test`, todo o fluxo da §5 até gerar `programas/demo/`, e o servidor MCP respondendo `tools/list`.
- **Não testado**: `npm run instalador` (sem Rust neste ambiente), Windows/macOS, Android, perfil L-SEED.
