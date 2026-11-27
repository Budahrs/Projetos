# Como contribuir

Obrigado por ajudar! Este repositório recebe correções, ferramentas novas, modelos de interface, motores e documentação do **Hefestus** (pasta [`hefestus/`](hefestus/)).

*English summary at the end.*

## 1. Prepare o ambiente

Siga [`hefestus/COMECE_AQUI.md`](hefestus/COMECE_AQUI.md). Em resumo:

```bash
cd hefestus
```

```bash
npm ci && npm run build && npm test
```

Todos os testes devem passar. Um teste é pulado nesta cópia, de propósito: ele confere a integração com o acervo completo do mantenedor.

## 2. Escolha o que fazer

- Issues com o rótulo **`boa primeira tarefa`** são pequenas e bem delimitadas.
- Issues com **`ajuda bem-vinda`** são maiores. Comente na issue antes de começar, para combinar a abordagem.
- Ideia nova: abra uma issue com o modelo **Ideia** antes de escrever muito código.

## 3. Faça a mudança

- Uma branch por assunto e um PR por assunto.
- Português do Brasil em textos de interface e documentação. Código e comentários podem estar em português ou inglês.
- Use as ferramentas do Hefestus (CLI/MCP) para gerar projetos `.hefestus`. Não edite o JSON à mão (ver [`hefestus/AGENTS.md`](hefestus/AGENTS.md)).
- Mudou comportamento? Inclua ou ajuste um teste em `hefestus/testes/`.
- Diga no PR o que foi testado e o que não foi. Uma interface pronta não é uma operação implementada: um comando sem motor aparece como **pendente** em `npm run cli -- ligacoes`.
- Código de terceiros só entra com licença compatível com Apache 2.0 (MIT, BSD, Apache…). Cite a origem em `hefestus/THIRD-PARTY-NOTICES.md` e guarde o texto da licença em `hefestus/licencas/`.

## 4. Assine seus commits (DCO)

Usamos o [Developer Certificate of Origin](https://developercertificate.org/) (DCO). Ao assinar, você declara que escreveu a contribuição ou tem o direito de enviá-la sob a licença do projeto. Você **continua dono** do que escreveu; ela entra sob a [Apache 2.0](LICENSE).

Basta usar `-s` no commit:

```bash
git commit -s -m "Corrige alinhamento do menu lateral"
```

Isso acrescenta a linha `Signed-off-by: Seu Nome <seu@email>`. O e-mail pode ser o `noreply` do GitHub. O CI recusa PRs com commits sem essa linha. Para assinar commits já feitos:

```bash
git rebase --signoff origin/main
```

## 5. Abra o PR

Preencha o modelo. O CI roda o build e todos os testes. Um mantenedor revisa, pode pedir ajustes e faz o merge.

## Contribuir peças para o banco de ferramentas

O banco é o acervo reutilizável do Hefestus: cada programa feito com ele pode deixar peças para os próximos.
Exporte só a peça (com `npm run banco:peca -- exportar …`), confira com `validar` e abra um PR com o arquivo em
`hefestus/banco-comunidade/`. O passo a passo e o que o validador recusa estão em
[`hefestus/banco-comunidade/README.md`](hefestus/banco-comunidade/README.md).
**Nunca envie** projetos inteiros, dados de clientes, senhas ou código que você não pode licenciar.

---

## English summary

Contributions are welcome under the [Apache License 2.0](LICENSE). Set up with `cd hefestus && npm ci && npm run build && npm test` (see `hefestus/COMECE_AQUI.md`). Sign every commit with the [DCO](https://developercertificate.org/) (`git commit -s`); the CI rejects unsigned commits. One topic per PR, include tests, and state what was and was not verified. Third-party code must carry an Apache-compatible license. UI text is in Brazilian Portuguese.
