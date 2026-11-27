# Organização dos programas do Hefestus

## Constatações da comparação local

O inventário em `inventario-projetos.json` identifica manifestos e diretórios de 18 projetos. Não constitui revisão integral de cada implementação. Pastas sem manifestos encontrados não são classificadas como programas completos nem como projetos defeituosos.

O PDF Studio separa contratos Core, implementações de PDF/OCR/conversão/segurança e a aplicação WPF. O Hefestus separa núcleo, interface do editor, ferramentas de automação e host Tauri. Antares usa aplicação web e host Tauri, com dependências declaradas em seus manifestos. Anima mantém variantes e documentação separadas. Tecnologias distintas precisam de adaptadores; a organização não deve obrigá-las a usar o mesmo motor.

## Padrão adotado

O documento editável é a fonte da interface e dos eventos. Motores implementam contratos, sem depender do editor. O host desktop compõe motores e interface. Recursos externos devem ser declarados e distribuídos quando necessário. A biblioteca conserva implementações e versões para reutilização.

No `.hefestus`, `documento` e `historico` continuam compatíveis com arquivos anteriores. O campo aditivo `pacote` contém manifesto, interface HTML executável, runtime JavaScript, eventos, referências de recursos e documentos. O manifesto aponta a entrada e cada papel. Salvar regenera os derivados do documento atual; sinais não implementados continuam pendentes. Isso não converte automaticamente um motor externo em código web.

Na exportação nativa:

| Parte | Local |
| --- | --- |
| Projeto editável | `programa.hefestus` |
| Interface executável | `programa/index.html` |
| Ligações com motores | `programa/ligacoes.json` e `LIGACOES.md` |
| Host e motor nativo | `src-tauri/src/` |
| Motores distribuídos | `src-tauri/motores/`, declarados em `bundle.resources` |
| Identidade e dependências | `programa.json`, `package.json`, `Cargo.toml` e locks |
| Especificações e ajuda | `documentos/` |
| Licenças | arquivos de licença de cada dependência |
| Validação | relatório de testes com ambiente, versão e evidências |

O instalador é um resultado da compilação, não apenas a presença de uma pasta Tauri. Compilação, execução, instalação e compatibilidade são verificações separadas.

## Documentação

PRD registra objetivo e público. SRS registra requisitos e critérios de aceite. SAD descreve composição e dependências. Contratos documentam entradas, saídas, erros e efeitos. O modelo de dados descreve persistência. QA separa plano e evidência executada. O manual explica tarefas do usuário. ADR registra contexto, escolha e consequências.

Requisitos, benchmarks e resultados não são inventados a partir de botões. O autor pode declarar informações em `documento.especificacaoSoftware`; os demais campos ficam explicitamente pendentes. O inventário de eventos é extraído dos identificadores reais.

## Oficina visual

A Forja usa uma área inteira. A Oficina de menus usa Blockly 13.4.0, licença Apache-2.0, incluído localmente. Conexões aceitam tipos compatíveis: interface → aba/seção → grupo → comando → comportamento. A aplicação valida a estrutura completa antes de substituir o contrato. A aparência dos objetos nativos continua no Designer.

Serialização segue a API JSON do Blockly: https://docs.blockly.com/guides/configure/serialization/

Os grafos de nós e exemplos de criptografia enviados como referência orientam a apresentação de conexões; não são implementações de funcionalidades criptográficas.
