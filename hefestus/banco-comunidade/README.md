# Banco da comunidade

Peças enviadas por quem usa o Hefestus: ferramentas, modelos de interface, motores e recursos compartilhados.
Cada arquivo `*.peca.json` é um pacote no formato do armazém (`hefestus-armazem`) com um bloco `contribuicao`
(autor, licença, descrição). O `importar` do armazém aceita esses arquivos sem mudança.

## Como enviar uma peça

1. No editor, abra o **Armazém** e use **Exportar armazém (.json)**.
2. Tire dele só a peça que quer contribuir (as dependências vão junto; o que já está igual no banco oficial fica de fora):

   ```bash
   npm run banco:peca -- exportar armazem-hefestus.json ferramenta/meu-programa/minha-peca@1.0.0 --autor "Seu Nome <seu@email>" --licenca Apache-2.0 --descricao "Para que serve" --saida banco-comunidade/meu-programa-minha-peca.peca.json
   ```

3. Confira:

   ```bash
   npm run banco:peca -- validar banco-comunidade/meu-programa-minha-peca.peca.json
   ```

4. Abra um PR com o arquivo (commits assinados, `git commit -s`). O CI roda o mesmo validador.

## O que o validador recusa

- Conteúdo alterado ou corrompido (o hash de cada cópia é conferido).
- Licença fora da lista compatível com a Apache 2.0: Apache-2.0, MIT, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, CC0-1.0, Unlicense, Zlib.
- Ferramenta sem contrato (JSON Schema de entrada).
- Peça que já existe no banco oficial com outro conteúdo: publique uma versão nova.
- Código que acessa rede, disco ou executa texto (`fetch`, `WebSocket`, `eval`, `new Function`, `child_process`, módulos `fs`/`net`/`http`…).
- Aparência de segredo (tokens do GitHub, chaves da AWS ou do Google, chaves privadas, `sk-…`).
- Conteúdo novo acima de 1 MB (abra uma issue antes).
- `usadoPor` preenchido: nomes de projetos de quem exportou não vão junto.

O validador só lê texto; não executa as peças. Ele não substitui a revisão humana: os mantenedores leem cada peça antes do merge.

**Nunca envie** projetos inteiros, dados de clientes, senhas ou código que você não pode licenciar.

## Estado

Implementado: exportação de uma peça com dependências, validador, conferência no CI.
Planejado: incluir as peças aprovadas no banco embutido do editor (`npm run banco:atualizar`) e um botão
"Contribuir peça" no Armazém.
