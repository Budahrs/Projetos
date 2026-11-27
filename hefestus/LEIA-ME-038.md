# Telas próprias dos projetos — Hefestus 0.38

19/10/2026. Ferramenta incorporada ao Hefestus e telas de entrada instaladas para os dez projetos cadastrados: Hefestus, Antares, EcosNote, PDF Studio, Anima Studio, Axiom Studio, Morpheus, Nightreign Engine, Daedalus NOC e NexusOps.

## Como abrir

Use os mesmos atalhos em Meus Projetos, na área de trabalho. Cada atalho abre uma tela com nome e ícone do projeto, descrição, módulos, anotações, pendências e aparência. O botão Abrir programa / Continuar abre o editor anterior. NexusOps abre sua pasta, pois esse era o destino cadastrado.

As telas são entradas para os ambientes existentes; não incorporam os motores nem reconstroem os editores. A lista de módulos indica áreas do programa, sem simular comandos individuais que ainda não têm adaptadores.

Anotações são salvas por projeto em %LOCALAPPDATA%/MeusProjetos/<id>/notas.md. Preferências ficam ao lado. O tema acompanha o Windows em automatico, ou pode ser fixado em Light, Dark, Dim e High Contrast. A aparência da tela não altera o conteúdo do documento aberto no editor.

## Criar telas no Hefestus

Recarregue o Hefestus e confira v0.38.0. Abra Opções > Criar tela de projeto. Configure nome, identificador, descrição, destino, pasta, módulos, ícone e pedidos vinculados. A prévia não inicia executáveis.

Salvar configuração guarda o rascunho no navegador. Exportar perfil gera projeto.json. Exportar tela e runtime gera um pacote hefestus.arquivos com perfil, runtime Python/Tk, temas e instruções. Use o materializador existente para extraí-lo em uma pasta nova. O runtime requer Python/Tk no Windows; o runtime já instalado do Antares serve às dez telas deste computador.

Também disponível na pasta do Hefestus:

    node ferramentas/gerar-tela.mjs projeto.json pasta-nova

Padrão: novos projetos devem ter identidade e tela própria, mantendo o tema compartilhado e os atalhos dentro de Meus Projetos.

## Reversão e limites

Perfis estão em Perfis/. Destinos/argumentos/diretórios anteriores estão em destinos-originais.json. Cópias dos atalhos anteriores estão em Backup-atalhos-diretos/. Para voltar à abertura direta, copie o atalho desejado desse backup para Meus Projetos.

Os perfis instalados contêm caminhos deste computador. Ao transferir para outro PC, ajuste destino, pasta, ícone, temas e fonte das pendências. O runtime não é incluído novamente nesta distribuição. Exportações da ferramenta possuem seu próprio código Python, mas não incluem uma instalação Python.

Nenhum teste, abertura de tela, programa ou validação interativa foi executado, conforme a orientação anterior. Foram gerados arquivos, atualizado o empacotamento do Hefestus e gravados os atalhos. A implementação permanece sem validação funcional.
