# Candidato S2b — Progresso e HDB

Branch local de validação em cima de `58183e4` (#53), com os commits de auditoria aplicados exclusivamente neste candidato. Não altera o PR remoto nem a main.

- Projetos → Progresso: tabela do App Shell com inventário, capacidades, arquivos de teste, referências HDB, correspondências/divergências e estado não mensurado sem critérios de aceite ponderados.
- Projetos → Catálogo: mostra as referências HDB com a condição do baseline e da última conferência, sem o localizador de arquivo privado.
- Memória → Dados: consulta o snapshot em SQLite em modo somente leitura, sem sincronização automática e com aviso de atualização separada.

Teste backend: `python -B l-seed/INDICE-VETORIAL-v1.5/teste_painel_shell.py`; teste opcional do DOM, somente fixture: `python -B hefestus/ferramentas/verificar-shell-progresso.py --chrome <executável>`; testes de perfil e shell em `hefestus/testes/`. O DOM em Chrome headless exibiu a tabela com os dados de ensaio e “Não mensurado”. Consultas locais de dados/progresso com o cofre/portfólio real responderam, 17 projetos, os dois hashes SQLite permaneceram idênticos. Não foi homologado uso humano, Ollama real, instalador, ou atualização da instalação operacional.
