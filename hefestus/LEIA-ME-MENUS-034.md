# Hefestus 0.34 — menus, ferramentas e métricas

Abra `Hefestus-0.34.html`, na pasta de entregas. A instalação original em `C:\caminho\para\hefestus` também foi atualizada. O rodapé identifica **v0.34.0**. O backup anterior está em `Hefestus-menu-backup.zip`.

## Primeiro o Hefestus

O cabeçalho agora oferece **Criar interface**, **Lógica e eventos** e **Revisar e exportar**, além de **Buscar** (Ctrl+K) e **Oficina de menus**. Os perfis priorizam as abas, mantendo os comandos disponíveis. A faixa abre fixa e padroniza destaques, ícones e grupos; continua recolhível. A organização anterior pode ser restaurada pela oficina quando houver preferências antigas salvas.

Na oficina:

1. Escolha uma aba, grupo e comando. Edite nomes, descrição, ordem e destaque.
2. Em **Ferramenta do banco**, escolha o comando existente a vincular. O ID visual e o vínculo são independentes.
3. A prévia e o código gerado acompanham a alteração. A prévia emite sinais; não executa os motores PDF dentro do navegador.
4. Use **Salvar na biblioteca**, **Inserir no designer** ou **Exportar pacote JSON**. **Salvar oficina** preserva a edição no navegador; exportar JSON cria uma cópia em arquivo.
5. Em **Designer JSON e códigos por alvo**, revise HTML e XAML. Uma seção guardada como manual não será sobrescrita; é marcada para revisão quando o designer mudar. A prévia usa a saída gerada e isolada, sem executar o código manual digitado.

O modelo **PDF Studio · faixa por tarefas** também está na biblioteca. Os componentes guardam sinais e contratos de comportamento, com os 66 registros do banco. O motor de negócio continua no PDF Studio; menus não copiam uma implementação de PDF para JavaScript.

## Depois o PDF Studio

O mesmo pacote gerou seis abas e 16 grupos, consumidos por `TaskMenu.cs`. O aplicativo usa ícones do Windows, uma ação maior por grupo, comandos em pilhas e menus **Mais**. Ctrl+K abre a busca; Ctrl+F1 recolhe a faixa. A central e o layout conferem os IDs do mesmo banco. Os 12 temas permanecem disponíveis e foram acrescentados também à galeria do Hefestus com o prefixo **Studio**.

## Arquivos e geração

`Projeto` contém as fontes da instalação atualizada, incluindo `js/nucleo/menuEngine.js`, `js/ui/oficinaMenus.js`, o pacote padrão, testes e gerador. Os arquivos soltos nesta pasta são cópias dos novos módulos para revisão; execute o projeto preservando sua estrutura de diretórios.

No diretório `Projeto`, com Node disponível:

```powershell
node build.mjs
node ferramentas/gerar-menu.mjs caminho/do/pacote.json pasta-de-saida
node --test testes/menuEngine.test.mjs testes/oficinaMenus.test.mjs testes/workspace.test.mjs testes/dist.test.mjs testes/selecao.test.mjs testes/complemento.test.mjs
```

O gerador exporta pacote, componente, HTML, fragmento XAML, layout e banco. O arquivo `menu.schema.json` documenta o contrato; a validação executada pelo gerador também confere IDs, destaques e vínculos. Mobile, Qt/Slint e tradução reversa de código arbitrário não foram implementados. O fragmento XAML precisa de um host para executar seus comandos.

As métricas, metas ainda não medidas e limites de teste estão em `METRICAS.md`. As quatro fontes completas, seus hashes e 1.167 blocos sem perda estão em `Referencias-metricas`. Não foi criado um orquestrador Arconte/Antares ou um gerador de voz/imagem como efeito de ler essas referências.
