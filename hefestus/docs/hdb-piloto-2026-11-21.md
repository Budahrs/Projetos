# HDB: piloto versionado da capacidade Armazém (21/11/2026)

Refs #44 e #53. O banco histórico continua intacto (snapshot 0.46). Este piloto usa o próprio `Armazem` da versão 2.1.0 e gera um pacote independente, compatível com a ferramenta de recuperação existente.

## Reproduzir em pasta de ensaio

Na pasta `hefestus`, escolher um destino de arquivo novo e uma pasta de destino nova:

```powershell
node ferramentas/hdb-piloto.mjs gerar <novo-pacote.json>
node ferramentas/hdb-piloto.mjs conferir <novo-pacote.json> compartilhado/hefestus/armazem-piloto@2.1.0
node ferramentas/restaurar-fontes-banco.mjs <novo-pacote.json> compartilhado/hefestus/armazem-piloto@2.1.0 <pasta-nova>
```

Na pasta restaurada: `node --test testes/armazem.test.mjs`. O teste usa somente Node e as três fontes recuperadas. Não instalar dependências do aplicativo integral para este piloto. O manifesto não é autorização para executar receitas de terceiros. O gerador usa um conjunto fixo de cinco arquivos e recusa sobrescrever o pacote de destino.

## Verificação real

- Identidade F1 `cap-3532c35c5e` encontrada no SQLite gerado pelo `portfolio.py` do L-SEED: projeto `prj-hefestus`, caminho `js/nucleo/armazem.js`.
- Pacote piloto 2.1.0: 5 arquivos (3 módulos, teste, package.json), 18.440 bytes de pacote na execução de 21/11. Cópia restaurada em pasta nova: todos os 5 SHA-256 coincidiram com os originais; 8/8 testes do Armazém. Suíte combinada (`hdb-piloto.test.mjs` + `armazem.test.mjs`): 11/11. Conferência de hashes, versão e ID do manifesto. Nenhum arquivo do banco anterior substituído.
- Licença de redistribuição do projeto ainda não verificada; a guarda é local. Não equivale a preservação do aplicativo Hephaestus completo, build nativo, homologação do cofre real ou integração das PRs abertas.

## Estado das requisições consultadas

| Requisição | Estado na consulta | Próxima ação |
|---|---|---|
| #44 | Aberta, plano mestre | Contrato e piloto HDB; ampliar a capacidade preservada e provar ciclo com L-SEED |
| #45–#52 | Fechadas; base local já contém as respectivas linhas principais | Manter rastreabilidade e regressões |
| #53 | Aberta, S2b | Testes selecionados e build HTML já verificados; falta homologação com cofre real |
| #54 | Aberta, contrato MCP 1.8 | Revisar mudanças separadamente; não juntar automaticamente ao #53 |
| #55 | Aberta, BRS3 0.2 | Comparar APIs e função com BRS3/COA existente antes de incorporar |
| #56 | Aberta, ferramenta de envio | Revisar e validar em isolamento; não enviar código sem autorização |
| #57 | Aberta, revisão das branches | Usar catálogo de resgates, preservar originais e decisão sobre Layla |

Nenhuma requisição encerrada nem PR mesclado/publicado por esta intervenção.
