// Estrutura extraída de abasBase em ui/ribbon.js (node tools/gerar-menu-hefestus.mjs).
export const HEFESTUS_MENU_SPEC = [
  {
    "id": "arquivo",
    "nome": "Arquivo",
    "grupos": [
      {
        "nome": "Projeto",
        "comandos": [
          {
            "id": "novo",
            "nome": "Novo",
            "icone": "novo",
            "tam": "pequeno"
          },
          {
            "id": "abrir",
            "nome": "Abrir",
            "icone": "abrir",
            "tam": "pequeno",
            "atalho": "Ctrl+O"
          },
          {
            "id": "salvar",
            "nome": "Salvar",
            "icone": "salvar",
            "tam": "pequeno",
            "atalho": "Ctrl+S"
          }
        ]
      },
      {
        "nome": "Exportar",
        "comandos": [
          {
            "id": "exp-windows",
            "nome": "Aplicativo Windows…",
            "icone": "aplicativo",
            "tam": "pequeno"
          },
          {
            "id": "exp-html",
            "nome": "HTML + documentos",
            "icone": "exportar",
            "tam": "pequeno"
          },
          {
            "id": "exp-comp",
            "nome": "Componente…",
            "icone": "codigo",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "exp-docs",
            "nome": "Documentação dos sinais (.md)",
            "icone": "documento",
            "tam": "pequeno"
          },
          {
            "id": "exp-separado",
            "nome": "Projeto + histórico separados",
            "icone": "salvar",
            "tam": "pequeno"
          },
          {
            "id": "abrir-hist",
            "nome": "Abrir histórico (.jsonl)…",
            "icone": "abrir",
            "tam": "pequeno"
          },
          {
            "id": "cop-html",
            "nome": "Copiar HTML",
            "icone": "copiar",
            "tam": "pequeno"
          },
          {
            "id": "cop-json",
            "nome": "Copiar JSON",
            "icone": "codigo",
            "tam": "pequeno"
          },
          {
            "id": "ver-cod",
            "nome": "Ver código",
            "icone": "codigo",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Biblioteca",
        "comandos": [
          {
            "id": "arq-salvar-modelo",
            "nome": "Salvar seleção como modelo",
            "icone": "modelo",
            "tam": "pequeno"
          },
          {
            "id": "arq-exp-modelos",
            "nome": "Exportar meus modelos",
            "icone": "exportar",
            "tam": "pequeno"
          },
          {
            "id": "arq-imp-modelos",
            "nome": "Importar modelos",
            "icone": "abrir",
            "tam": "pequeno"
          }
        ]
      }
    ]
  },
  {
    "id": "inicio",
    "nome": "Página Inicial",
    "grupos": [
      {
        "nome": "Área de transferência",
        "comandos": [
          {
            "id": "colar",
            "nome": "Colar",
            "icone": "colar",
            "tam": "grande",
            "atalho": "Ctrl+V"
          },
          {
            "id": "cortar",
            "nome": "Recortar",
            "icone": "cortar",
            "tam": "pequeno",
            "atalho": "Ctrl+X"
          },
          {
            "id": "copiar-el",
            "nome": "Copiar",
            "icone": "copiar",
            "tam": "pequeno",
            "atalho": "Ctrl+C"
          },
          {
            "id": "pincel-formatacao",
            "nome": "Pincel de formatação",
            "icone": "pincel",
            "tam": "pequeno"
          },
          {
            "id": "pincel-opcoes",
            "nome": "Opções do pincel",
            "icone": "propriedades",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Cores, fonte e bordas",
                "icone": "pincel"
              },
              {
                "nome": "Efeitos e sombras",
                "icone": "pincel"
              },
              {
                "nome": "Vínculos, interações e transições",
                "icone": "pincel"
              },
              {
                "nome": "Código HTML, CSS e JavaScript",
                "icone": "pincel"
              },
              {
                "nome": "Ativar pincel contínuo",
                "icone": "pincel"
              }
            ]
          },
          {
            "id": "colar-lugar",
            "nome": "Colar no mesmo lugar",
            "icone": "colar",
            "tam": "pequeno",
            "atalho": "Ctrl+Shift+V"
          }
        ]
      },
      {
        "nome": "Histórico",
        "comandos": [
          {
            "id": "desf",
            "nome": "Desfazer",
            "icone": "desfazer",
            "tam": "pequeno",
            "atalho": "Ctrl+Z"
          },
          {
            "id": "refz",
            "nome": "Refazer",
            "icone": "refazer",
            "tam": "pequeno",
            "atalho": "Ctrl+Y"
          }
        ]
      },
      {
        "nome": "Edição",
        "comandos": [
          {
            "id": "dup",
            "nome": "Duplicar",
            "icone": "duplicar",
            "tam": "grande",
            "atalho": "Ctrl+D"
          },
          {
            "id": "exc",
            "nome": "Excluir",
            "icone": "excluir",
            "tam": "pequeno",
            "atalho": "Del"
          },
          {
            "id": "trav",
            "nome": "Travar posição",
            "icone": "travar",
            "tam": "pequeno"
          },
          {
            "id": "vis",
            "nome": "Ocultar",
            "icone": "olhoFechado",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Inserir rápido",
        "comandos": [
          {
            "id": "ins-botao",
            "nome": "Botão",
            "icone": "botao",
            "tam": "pequeno"
          },
          {
            "id": "ins-texto",
            "nome": "Texto",
            "icone": "texto",
            "tam": "pequeno"
          },
          {
            "id": "ins-caixa",
            "nome": "Caixa",
            "icone": "caixa",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Seleção",
        "comandos": [
          {
            "id": "sel-tudo",
            "nome": "Selecionar tudo",
            "icone": "selTudo",
            "tam": "grande",
            "atalho": "Ctrl+A"
          },
          {
            "id": "sel-tipo",
            "nome": "Mesmo tipo",
            "icone": "camadas",
            "tam": "pequeno"
          },
          {
            "id": "sel-cor",
            "nome": "Mesma cor",
            "icone": "tema",
            "tam": "pequeno"
          },
          {
            "id": "sel-painel",
            "nome": "Painel de seleção",
            "icone": "camadas",
            "tam": "pequeno"
          },
          {
            "id": "sel-inv",
            "nome": "Inverter seleção",
            "icone": "espelharH",
            "tam": "pequeno",
            "atalho": "Ctrl+Shift+A"
          },
          {
            "id": "sel-filhos",
            "nome": "Selecionar conteúdo",
            "icone": "grade",
            "tam": "pequeno"
          },
          {
            "id": "sel-pai",
            "nome": "Selecionar o container",
            "icone": "setaCima",
            "tam": "pequeno"
          },
          {
            "id": "sel-form",
            "nome": "Mesmo item do formulário",
            "icone": "painelLateral",
            "tam": "pequeno"
          },
          {
            "id": "sel-nada",
            "nome": "Limpar seleção",
            "icone": "fechar",
            "tam": "pequeno",
            "atalho": "Esc"
          }
        ]
      },
      {
        "nome": "Vetor e organizar",
        "comandos": [
          {
            "id": "ic-unir",
            "nome": "Unir formas",
            "icone": "boolUnir",
            "tam": "pequeno"
          },
          {
            "id": "ic-subtrair",
            "nome": "Subtrair (corte)",
            "icone": "boolSubtrair",
            "tam": "pequeno"
          },
          {
            "id": "ic-intersectar",
            "nome": "Interseção (corte condicional)",
            "icone": "boolInterseccao",
            "tam": "pequeno"
          },
          {
            "id": "ic-excluir",
            "nome": "Excluir sobreposição",
            "icone": "boolExcluir",
            "tam": "pequeno"
          },
          {
            "id": "ic-agrupar",
            "nome": "Agrupar (Ctrl+G)",
            "icone": "agrupar",
            "tam": "pequeno"
          },
          {
            "id": "ic-desagrupar",
            "nome": "Desagrupar",
            "icone": "desagrupar",
            "tam": "pequeno"
          },
          {
            "id": "ic-frente",
            "nome": "Trazer para frente (Ctrl+])",
            "icone": "frente",
            "tam": "pequeno"
          },
          {
            "id": "ic-tras",
            "nome": "Enviar para trás (Ctrl+[)",
            "icone": "tras",
            "tam": "pequeno"
          },
          {
            "id": "ic-mascara",
            "nome": "Criar máscara",
            "icone": "mascaraCriar",
            "tam": "pequeno"
          },
          {
            "id": "ic-liberar",
            "nome": "Liberar máscara",
            "icone": "mascaraLiberar",
            "tam": "pequeno"
          },
          {
            "id": "ic-girar",
            "nome": "Girar 90°",
            "icone": "girar",
            "tam": "pequeno"
          },
          {
            "id": "ic-espelhar",
            "nome": "Espelhar horizontal",
            "icone": "espelharH",
            "tam": "pequeno"
          }
        ]
      }
    ]
  },
  {
    "id": "inserir",
    "nome": "Inserir",
    "grupos": [
      {
        "nome": "Biblioteca",
        "comandos": [
          {
            "id": "ins-modelos",
            "nome": "Modelos",
            "icone": "modelo",
            "tam": "grande",
            "menu": true
          },
          {
            "id": "ins-bib",
            "nome": "Painel Biblioteca",
            "icone": "biblioteca",
            "tam": "pequeno"
          },
          {
            "id": "ins-html-forja",
            "nome": "Colar HTML e recriar artefato",
            "icone": "codigo",
            "tam": "pequeno"
          },
          {
            "id": "ins-salvar-modelo",
            "nome": "Salvar como modelo",
            "icone": "salvar",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Formas",
        "comandos": [
          {
            "id": "ins-formas",
            "nome": "Formas básicas",
            "icone": "caixa",
            "tam": "grande",
            "menu": true
          },
          {
            "id": "ins-caixa",
            "nome": "Caixa",
            "icone": "caixa",
            "tam": "pequeno"
          },
          {
            "id": "ins-elipse",
            "nome": "Elipse",
            "icone": "elipse",
            "tam": "pequeno"
          },
          {
            "id": "ins-linha",
            "nome": "Linha",
            "icone": "linha",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Texto",
        "comandos": [
          {
            "id": "ins-texto",
            "nome": "Texto",
            "icone": "texto",
            "tam": "grande"
          }
        ]
      },
      {
        "nome": "Controles",
        "comandos": [
          {
            "id": "ins-botao",
            "nome": "Botão",
            "icone": "botao",
            "tam": "pequeno"
          },
          {
            "id": "ins-campo",
            "nome": "Campo de texto",
            "icone": "campo",
            "tam": "pequeno"
          },
          {
            "id": "ins-toggle",
            "nome": "Toggle",
            "icone": "toggle",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Navegação",
        "comandos": [
          {
            "id": "ins-menu",
            "nome": "Menu",
            "icone": "menu",
            "tam": "grande"
          }
        ]
      },
      {
        "nome": "Flutuantes",
        "comandos": [
          {
            "id": "ins-modal",
            "nome": "Modal",
            "icone": "modal",
            "tam": "pequeno"
          },
          {
            "id": "ins-toast",
            "nome": "Notificação",
            "icone": "toast",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Componentes",
        "comandos": [
          {
            "id": "ins-comp",
            "nome": "Componentes",
            "icone": "mais",
            "tam": "grande",
            "menu": true,
            "sub": [
              {
                "nome": "Breadcrumb (trilha)",
                "icone": "mais"
              },
              {
                "nome": "Paginação",
                "icone": "mais"
              },
              {
                "nome": "Chips / tags",
                "icone": "mais"
              },
              {
                "nome": "Badges (contadores)",
                "icone": "mais"
              },
              {
                "nome": "Barras de progresso",
                "icone": "mais"
              },
              {
                "nome": "Stepper (etapas)",
                "icone": "mais"
              },
              {
                "nome": "Notificações (toasts)",
                "icone": "mais"
              },
              {
                "nome": "Caixas de status",
                "icone": "mais"
              },
              {
                "nome": "Barra de ferramentas",
                "icone": "mais"
              },
              {
                "nome": "Janela modal (diálogo)",
                "icone": "mais"
              },
              {
                "nome": "Calendário",
                "icone": "mais"
              },
              {
                "nome": "Controles deslizantes",
                "icone": "mais"
              },
              {
                "nome": "Tabela de dados",
                "icone": "mais"
              },
              {
                "nome": "Cartão com gráfico",
                "icone": "mais"
              }
            ]
          }
        ]
      },
      {
        "nome": "Formulário",
        "comandos": [
          {
            "id": "ins-form-caixa",
            "nome": "Caixa",
            "icone": "caixa",
            "tam": "pequeno"
          },
          {
            "id": "ins-form-ribbon",
            "nome": "Faixa de opções",
            "icone": "menu",
            "tam": "pequeno"
          },
          {
            "id": "ins-form-menu",
            "nome": "Menu",
            "icone": "lista",
            "tam": "pequeno"
          },
          {
            "id": "ins-form-blocos",
            "nome": "Blocos",
            "icone": "grade",
            "tam": "pequeno"
          },
          {
            "id": "ins-form-lateral",
            "nome": "Barra lateral",
            "icone": "painelLateral",
            "tam": "pequeno"
          },
          {
            "id": "ins-form-abasDoc",
            "nome": "Abas de documento",
            "icone": "tela",
            "tam": "pequeno"
          },
          {
            "id": "ins-form-paineis",
            "nome": "Painéis",
            "icone": "camadas",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Sistemas",
        "comandos": [
          {
            "id": "ins-radio",
            "nome": "Controlador de rádios",
            "icone": "volume",
            "tam": "grande"
          }
        ]
      }
    ]
  },
  {
    "id": "desenhar",
    "nome": "Desenhar",
    "grupos": [
      {
        "nome": "Vetor",
        "comandos": [
          {
            "id": "ins-caneta",
            "nome": "Caneta",
            "icone": "caneta",
            "tam": "pequeno",
            "atalho": "P"
          },
          {
            "id": "ins-nos",
            "nome": "Editar nós",
            "icone": "nos",
            "tam": "pequeno"
          },
          {
            "id": "ins-svg",
            "nome": "Importar SVG",
            "icone": "abrir",
            "tam": "pequeno"
          },
          {
            "id": "ins-vetorizar",
            "nome": "Converter em vetor",
            "icone": "estrela",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Combinar formas",
        "comandos": [
          {
            "id": "bool-unir",
            "nome": "Unir",
            "icone": "boolUnir",
            "tam": "pequeno"
          },
          {
            "id": "bool-subtrair",
            "nome": "Subtrair",
            "icone": "boolSubtrair",
            "tam": "pequeno"
          },
          {
            "id": "bool-intersectar",
            "nome": "Interseção",
            "icone": "boolInterseccao",
            "tam": "pequeno"
          },
          {
            "id": "bool-excluir",
            "nome": "Excluir sobreposição",
            "icone": "boolExcluir",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Máscara",
        "comandos": [
          {
            "id": "mascara-criar",
            "nome": "Criar máscara",
            "icone": "boolInterseccao",
            "tam": "grande"
          },
          {
            "id": "mascara-liberar",
            "nome": "Liberar máscara",
            "icone": "boolExcluir",
            "tam": "pequeno"
          }
        ]
      }
    ]
  },
  {
    "id": "design",
    "nome": "Design",
    "grupos": [
      {
        "nome": "Tema da interface",
        "comandos": [
          {
            "id": "gal-temas",
            "nome": "Tema da interface (menus e barras)",
            "icone": "tema",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Automático"
              },
              {
                "nome": "Forja"
              },
              {
                "nome": "Forja escuro"
              },
              {
                "nome": "Grafite"
              },
              {
                "nome": "Claro"
              },
              {
                "nome": "Azul"
              },
              {
                "nome": "Âmbar"
              },
              {
                "nome": "Meia-noite"
              }
            ]
          }
        ]
      },
      {
        "nome": "Variantes",
        "comandos": [
          {
            "id": "var-tamanhos",
            "nome": "Tamanhos P/M/G",
            "icone": "modelo",
            "tam": "pequeno"
          },
          {
            "id": "var-estilos",
            "nome": "Estilos (primário, contorno…)",
            "icone": "modelo",
            "tam": "pequeno"
          },
          {
            "id": "var-refinar",
            "nome": "Refinar (3 opções)",
            "icone": "estrela",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Elementos",
        "comandos": [
          {
            "id": "paletas",
            "nome": "Recolorir elementos",
            "icone": "pincel",
            "tam": "grande",
            "menu": true
          }
        ]
      },
      {
        "nome": "Cor",
        "comandos": [
          {
            "id": "conta",
            "nome": "Conta-gotas",
            "icone": "contaGotas",
            "tam": "pequeno",
            "atalho": "I"
          },
          {
            "id": "d-fontes",
            "nome": "Fontes",
            "icone": "fonte",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "p-estilo",
            "nome": "Cores e estilo",
            "icone": "pincel",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Efeitos",
        "comandos": [
          {
            "id": "sombras",
            "nome": "Sombra",
            "icone": "efeitos",
            "tam": "grande",
            "menu": true
          },
          {
            "id": "vidro",
            "nome": "Vidro fosco",
            "icone": "caixa",
            "tam": "pequeno"
          },
          {
            "id": "desfoque",
            "nome": "Desfocar",
            "icone": "elipse",
            "tam": "pequeno"
          },
          {
            "id": "p-efeitos",
            "nome": "Mais efeitos",
            "icone": "propriedades",
            "tam": "pequeno"
          }
        ]
      }
    ]
  },
  {
    "id": "layout",
    "nome": "Layout",
    "grupos": [
      {
        "nome": "Configurar tela",
        "comandos": [
          {
            "id": "telas",
            "nome": "Tamanho",
            "icone": "tela",
            "tam": "grande",
            "menu": true
          }
        ]
      },
      {
        "nome": "Espaçamento",
        "comandos": [
          {
            "id": "lay-margem",
            "nome": "Margem interna",
            "icone": "largura",
            "tam": "pequeno"
          },
          {
            "id": "lay-espaco",
            "nome": "Espaço entre itens",
            "icone": "altura",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Alinhar",
        "comandos": [
          {
            "id": "al-esquerda",
            "nome": "À esquerda",
            "icone": "al-esq",
            "tam": "pequeno"
          },
          {
            "id": "al-centroH",
            "nome": "Ao centro",
            "icone": "al-centroH",
            "tam": "pequeno"
          },
          {
            "id": "al-direita",
            "nome": "À direita",
            "icone": "al-dir",
            "tam": "pequeno"
          },
          {
            "id": "al-topo",
            "nome": "Ao topo",
            "icone": "al-topo",
            "tam": "pequeno"
          },
          {
            "id": "al-centroV",
            "nome": "Ao meio",
            "icone": "al-centroV",
            "tam": "pequeno"
          },
          {
            "id": "al-base",
            "nome": "À base",
            "icone": "al-base",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Distribuir",
        "comandos": [
          {
            "id": "dist-h",
            "nome": "Na horizontal",
            "icone": "distH",
            "tam": "pequeno"
          },
          {
            "id": "dist-v",
            "nome": "Na vertical",
            "icone": "distV",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Girar e espelhar",
        "comandos": [
          {
            "id": "gir-d",
            "nome": "Girar 90° à direita",
            "icone": "girar",
            "tam": "pequeno"
          },
          {
            "id": "gir-e",
            "nome": "Girar 90° à esquerda",
            "icone": "girarEsq",
            "tam": "pequeno"
          },
          {
            "id": "gir-0",
            "nome": "Zerar rotação",
            "icone": "seta",
            "tam": "pequeno"
          },
          {
            "id": "esp-h",
            "nome": "Espelhar horizontal",
            "icone": "espelharH",
            "tam": "pequeno",
            "atalho": "Shift+H"
          },
          {
            "id": "esp-v",
            "nome": "Espelhar vertical",
            "icone": "espelharV",
            "tam": "pequeno",
            "atalho": "Shift+V"
          }
        ]
      },
      {
        "nome": "Grupos",
        "comandos": [
          {
            "id": "agrupar",
            "nome": "Agrupar",
            "icone": "modelo",
            "tam": "grande",
            "atalho": "Ctrl+G"
          },
          {
            "id": "ag-linha",
            "nome": "Grupo em linha",
            "icone": "distH",
            "tam": "pequeno"
          },
          {
            "id": "ag-coluna",
            "nome": "Grupo em coluna",
            "icone": "distV",
            "tam": "pequeno"
          },
          {
            "id": "desagrupar",
            "nome": "Desagrupar",
            "icone": "selTudo",
            "tam": "pequeno",
            "atalho": "Ctrl+Shift+G"
          }
        ]
      },
      {
        "nome": "Camadas",
        "comandos": [
          {
            "id": "frente",
            "nome": "Trazer para frente",
            "icone": "frente",
            "tam": "pequeno",
            "atalho": "Ctrl+]"
          },
          {
            "id": "tras",
            "nome": "Enviar para trás",
            "icone": "tras",
            "tam": "pequeno",
            "atalho": "Ctrl+["
          }
        ]
      }
    ]
  },
  {
    "id": "comportamento",
    "nome": "Comportamento",
    "grupos": [
      {
        "nome": "Testar",
        "comandos": [
          {
            "id": "previa",
            "nome": "Prévia interativa",
            "icone": "previa",
            "tam": "grande"
          },
          {
            "id": "prev-1440",
            "nome": "Desktop (1440)",
            "icone": "tela",
            "tam": "pequeno"
          },
          {
            "id": "prev-768",
            "nome": "Tablet (768)",
            "icone": "painelLateral",
            "tam": "pequeno"
          },
          {
            "id": "prev-390",
            "nome": "Celular (390)",
            "icone": "telefone",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Criar interação",
        "comandos": [
          {
            "id": "comp-tipo-navegacao",
            "nome": "Navegação e menus",
            "icone": "raio",
            "tam": "pequeno"
          },
          {
            "id": "comp-tipo-conteudo",
            "nome": "Conteúdo e organização",
            "icone": "raio",
            "tam": "pequeno"
          },
          {
            "id": "comp-tipo-ajuda",
            "nome": "Ajuda e dicas",
            "icone": "raio",
            "tam": "pequeno"
          },
          {
            "id": "comp-tipo-janelas",
            "nome": "Janelas e sobreposições",
            "icone": "raio",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Prontos",
        "comandos": [
          {
            "id": "comp-prontos",
            "nome": "Comportam. prontos",
            "icone": "raio",
            "tam": "pequeno"
          },
          {
            "id": "comp-resp",
            "nome": "Responsivo",
            "icone": "telaCheia",
            "tam": "pequeno"
          },
          {
            "id": "comp-html-resp",
            "nome": "HTML responsivo",
            "icone": "codigo",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Elemento",
        "comandos": [
          {
            "id": "p-estados",
            "nome": "Estados",
            "icone": "estados",
            "tam": "pequeno"
          },
          {
            "id": "p-eventos",
            "nome": "Eventos",
            "icone": "raio",
            "tam": "pequeno"
          },
          {
            "id": "p-acess",
            "nome": "Acessibilidade",
            "icone": "acess",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Contrato",
        "comandos": [
          {
            "id": "ver-sinais",
            "nome": "Sinais emitidos",
            "icone": "sinal",
            "tam": "grande"
          }
        ]
      }
    ]
  },
  {
    "id": "revisao",
    "nome": "Revisão",
    "grupos": [
      {
        "nome": "Linha do tempo",
        "comandos": [
          {
            "id": "h-desf",
            "nome": "Desfazer",
            "icone": "desfazer",
            "tam": "pequeno"
          },
          {
            "id": "h-refz",
            "nome": "Refazer",
            "icone": "refazer",
            "tam": "pequeno"
          },
          {
            "id": "h-linha",
            "nome": "Linha do tempo",
            "icone": "relogio",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Proteção",
        "comandos": [
          {
            "id": "h-dec",
            "nome": "Decisões protegidas",
            "icone": "escudo",
            "tam": "grande"
          }
        ]
      },
      {
        "nome": "Agente",
        "comandos": [
          {
            "id": "h-ag",
            "nome": "Conversa com o agente",
            "icone": "chat",
            "tam": "grande"
          }
        ]
      },
      {
        "nome": "Armazém",
        "comandos": [
          {
            "id": "arm-abrir",
            "nome": "Armazém de referências",
            "icone": "servidor",
            "tam": "grande"
          },
          {
            "id": "arm-sinc",
            "nome": "Sincronizar programa…",
            "icone": "importar",
            "tam": "pequeno"
          },
          {
            "id": "arm-cons",
            "nome": "Consolidar ferramentas",
            "icone": "camadas",
            "tam": "pequeno"
          },
          {
            "id": "arm-prop",
            "nome": "Pacote de atualização…",
            "icone": "exportar",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Auditoria e documentação",
        "comandos": [
          {
            "id": "aj-audit",
            "nome": "Auditoria do projeto",
            "icone": "check",
            "tam": "grande"
          },
          {
            "id": "aj-doc",
            "nome": "Documentação dos sinais",
            "icone": "documento",
            "tam": "pequeno"
          },
          {
            "id": "aj-sobre",
            "nome": "Sobre o Hefestus",
            "icone": "info",
            "tam": "pequeno"
          }
        ]
      }
    ]
  },
  {
    "id": "exibir",
    "nome": "Exibir",
    "grupos": [
      {
        "nome": "Zoom",
        "comandos": [
          {
            "id": "z-mais",
            "nome": "Aumentar",
            "icone": "zoom",
            "tam": "pequeno",
            "atalho": "Ctrl+="
          },
          {
            "id": "z-menos",
            "nome": "Diminuir",
            "icone": "menos",
            "tam": "pequeno",
            "atalho": "Ctrl+-"
          },
          {
            "id": "z-100",
            "nome": "Tamanho real (100%)",
            "icone": "tela",
            "tam": "pequeno",
            "atalho": "Ctrl+1"
          },
          {
            "id": "z-ajustar",
            "nome": "Ajustar à janela",
            "icone": "telaCheia",
            "tam": "grande",
            "atalho": "Ctrl+0"
          }
        ]
      },
      {
        "nome": "Navegar",
        "comandos": [
          {
            "id": "f-mao",
            "nome": "Mão",
            "icone": "mao",
            "tam": "pequeno",
            "atalho": "H"
          },
          {
            "id": "f-zoom",
            "nome": "Lupa",
            "icone": "zoom",
            "tam": "pequeno",
            "atalho": "Z"
          }
        ]
      },
      {
        "nome": "Mostrar",
        "comandos": [
          {
            "id": "reguas",
            "nome": "Réguas",
            "icone": "regua",
            "tam": "pequeno"
          },
          {
            "id": "grade",
            "nome": "Grade",
            "icone": "grade",
            "tam": "pequeno"
          },
          {
            "id": "ima",
            "nome": "Encaixar",
            "icone": "ima",
            "tam": "pequeno"
          },
          {
            "id": "ver-fechados",
            "nome": "Mostrar ocultos",
            "icone": "olho",
            "tam": "pequeno"
          },
          {
            "id": "lim-guias",
            "nome": "Limpar guias",
            "icone": "excluir",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Interface",
        "comandos": [
          {
            "id": "modo-hibrido",
            "nome": "Modo híbrido",
            "icone": "painelLateral",
            "tam": "pequeno"
          },
          {
            "id": "estilo-menu",
            "nome": "Estilo do menu",
            "icone": "menu",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Faixa de opções",
                "icone": "ferramentas"
              },
              {
                "nome": "Barra de menus",
                "icone": "lista"
              }
            ]
          },
          {
            "id": "formato",
            "nome": "Formato",
            "icone": "contorno",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Quadrado"
              },
              {
                "nome": "Arredondado"
              },
              {
                "nome": "Moderno"
              }
            ]
          },
          {
            "id": "tema-ui",
            "nome": "Tema",
            "icone": "tema",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Automático"
              },
              {
                "nome": "Forja"
              },
              {
                "nome": "Forja escuro"
              },
              {
                "nome": "Grafite"
              },
              {
                "nome": "Claro"
              },
              {
                "nome": "Azul"
              },
              {
                "nome": "Âmbar"
              },
              {
                "nome": "Meia-noite"
              }
            ]
          },
          {
            "id": "densidade",
            "nome": "Densidade: normal",
            "icone": "camadas",
            "tam": "pequeno"
          },
          {
            "id": "ic-windows",
            "nome": "Ícones: Windows",
            "icone": "tema",
            "tam": "pequeno"
          },
          {
            "id": "sons",
            "nome": "Sons de encaixe",
            "icone": "volume",
            "tam": "pequeno"
          },
          {
            "id": "barra-ferr",
            "nome": "Barra de ferramentas",
            "icone": "ferramentas",
            "tam": "pequeno",
            "atalho": "F6"
          }
        ]
      },
      {
        "nome": "Movimento",
        "comandos": [
          {
            "id": "movimento-menus",
            "nome": "Animação dos menus",
            "icone": "estados",
            "tam": "grande",
            "menu": true,
            "sub": [
              {
                "nome": "Sem animação",
                "icone": "estados"
              },
              {
                "nome": "Aparecer suavemente",
                "icone": "estados"
              },
              {
                "nome": "Revelar ao abrir",
                "icone": "estados"
              },
              {
                "nome": "Duração: Rápida",
                "icone": "relogio"
              },
              {
                "nome": "Duração: Normal",
                "icone": "relogio"
              },
              {
                "nome": "Duração: Lenta",
                "icone": "relogio"
              }
            ]
          }
        ]
      },
      {
        "nome": "Painéis",
        "comandos": [
          {
            "id": "pn-esq",
            "nome": "Painéis à esquerda",
            "icone": "camadas",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Agente",
                "icone": "chat"
              },
              {
                "nome": "Componentes",
                "icone": "mais"
              },
              {
                "nome": "Biblioteca",
                "icone": "biblioteca"
              },
              {
                "nome": "Camadas",
                "icone": "camadas"
              },
              {
                "nome": "Auditoria",
                "icone": "check"
              },
              {
                "nome": "Linha do tempo",
                "icone": "relogio"
              },
              {
                "nome": "Decisões protegidas",
                "icone": "escudo"
              }
            ]
          },
          {
            "id": "pn-dir",
            "nome": "Painéis à direita",
            "icone": "propriedades",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Propriedades",
                "icone": "propriedades"
              },
              {
                "nome": "Estilo e cores",
                "icone": "pincel"
              },
              {
                "nome": "Transformação e efeitos",
                "icone": "efeitos"
              },
              {
                "nome": "Responsivo",
                "icone": "telaCheia"
              },
              {
                "nome": "Comportamento",
                "icone": "estados"
              },
              {
                "nome": "Eventos e sinais",
                "icone": "raio"
              },
              {
                "nome": "Acessibilidade",
                "icone": "acess"
              }
            ]
          }
        ]
      },
      {
        "nome": "Janela",
        "comandos": [
          {
            "id": "cheia",
            "nome": "Tela cheia",
            "icone": "telaCheia",
            "tam": "pequeno"
          },
          {
            "id": "recolher",
            "nome": "Recolher faixa",
            "icone": "setaCima",
            "tam": "pequeno",
            "atalho": "Ctrl+F1"
          }
        ]
      }
    ]
  },
  {
    "id": "ajuda",
    "nome": "Ajuda",
    "grupos": [
      {
        "nome": "Ajuda",
        "comandos": [
          {
            "id": "ajuda-busca",
            "nome": "Pesquisar comandos",
            "icone": "buscar",
            "tam": "pequeno",
            "atalho": "Ctrl+F"
          },
          {
            "id": "atalhos",
            "nome": "Atalhos de teclado",
            "icone": "ajuda",
            "tam": "pequeno",
            "atalho": "F1"
          },
          {
            "id": "ag-ajuda",
            "nome": "Pedir ao agente",
            "icone": "chat",
            "tam": "pequeno"
          },
          {
            "id": "primeiros-passos",
            "nome": "Primeiros passos",
            "icone": "play",
            "tam": "pequeno"
          }
        ]
      }
    ]
  },
  {
    "id": "formatar",
    "nome": "Formatar",
    "grupos": [
      {
        "nome": "Ícone na forma",
        "comandos": [
          {
            "id": "f-icone-forma",
            "nome": "Adicionar ícone à forma",
            "icone": "icone",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "f-importar-icone",
            "nome": "Importar ícones SVG/PNG",
            "icone": "abrir",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Inserir Formas",
        "comandos": [
          {
            "id": "gal-formas",
            "nome": "Formas",
            "icone": "estrela",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "f-alterar-forma",
            "nome": "Alterar Forma",
            "icone": "estrela",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "f-editar-pontos",
            "nome": "Editar Pontos",
            "icone": "nos",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Estilos de Forma",
        "comandos": [
          {
            "id": "gal-estilos",
            "nome": "Estilos de forma",
            "icone": "pincel",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Contorno azul"
              },
              {
                "nome": "Contorno verde"
              },
              {
                "nome": "Preto"
              },
              {
                "nome": "Azul"
              },
              {
                "nome": "Laranja"
              },
              {
                "nome": "Cinza"
              },
              {
                "nome": "Amarelo"
              },
              {
                "nome": "Verde"
              },
              {
                "nome": "Azul suave"
              },
              {
                "nome": "Laranja suave"
              },
              {
                "nome": "Verde suave"
              },
              {
                "nome": "Grafite"
              }
            ]
          },
          {
            "id": "preench",
            "nome": "Preenchimento da forma",
            "icone": "preencher",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "contorno",
            "nome": "Contorno da forma",
            "icone": "contorno",
            "tam": "pequeno",
            "menu": true
          },
          {
            "id": "efeitos-forma",
            "nome": "Efeitos da forma",
            "icone": "efeitos",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Sombra pequena",
                "icone": "efeitos"
              },
              {
                "nome": "Sombra média",
                "icone": "efeitos"
              },
              {
                "nome": "Sombra grande",
                "icone": "efeitos"
              },
              {
                "nome": "Desfoque",
                "icone": "elipse"
              },
              {
                "nome": "Vidro fosco",
                "icone": "caixa"
              },
              {
                "nome": "Remover efeitos",
                "icone": "fechar"
              }
            ]
          }
        ]
      },
      {
        "nome": "Efeitos de botão",
        "comandos": [
          {
            "id": "gal-efeitos-botao",
            "nome": "Efeitos de botão",
            "icone": "efeitos",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Plano"
              },
              {
                "nome": "Elevado"
              },
              {
                "nome": "Relevo (bisel)"
              },
              {
                "nome": "3D (tecla)"
              },
              {
                "nome": "Neumorfismo"
              },
              {
                "nome": "Afundado"
              },
              {
                "nome": "Gradiente brilhante"
              },
              {
                "nome": "Pílula com gradiente"
              },
              {
                "nome": "Brilho (glow)"
              },
              {
                "nome": "Neon"
              },
              {
                "nome": "Vidro fosco"
              },
              {
                "nome": "Contorno"
              },
              {
                "nome": "Ondulação ao clicar"
              },
              {
                "nome": "Pulso ao clicar"
              }
            ]
          }
        ]
      },
      {
        "nome": "Texto",
        "comandos": [
          {
            "id": "t-negrito",
            "nome": "Negrito",
            "icone": "md-format-bold",
            "tam": "pequeno"
          },
          {
            "id": "t-al-esquerda",
            "nome": "Alinhar à esquerda",
            "icone": "md-format-align-left",
            "tam": "pequeno"
          },
          {
            "id": "t-al-centro",
            "nome": "Centralizar texto",
            "icone": "md-format-align-center",
            "tam": "pequeno"
          },
          {
            "id": "t-al-direita",
            "nome": "Alinhar à direita",
            "icone": "md-format-align-right",
            "tam": "pequeno"
          },
          {
            "id": "t-cor",
            "nome": "Cor do texto",
            "icone": "md-format-color-text",
            "tam": "pequeno",
            "menu": true
          }
        ]
      },
      {
        "nome": "Fonte e ícone",
        "comandos": [
          {
            "id": "f-fonte",
            "nome": "Fonte",
            "icone": "fonte",
            "tam": "grande",
            "menu": true
          },
          {
            "id": "f-tam-fonte",
            "nome": "Tamanho da fonte",
            "icone": "texto",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Organizar",
        "comandos": [
          {
            "id": "f-avancar",
            "nome": "Avançar",
            "icone": "frente",
            "tam": "pequeno"
          },
          {
            "id": "f-recuar",
            "nome": "Recuar",
            "icone": "tras",
            "tam": "pequeno"
          },
          {
            "id": "f-dup",
            "nome": "Duplicar",
            "icone": "duplicar",
            "tam": "pequeno"
          },
          {
            "id": "f-alinhar",
            "nome": "Alinhar",
            "icone": "alinhar",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "À esquerda",
                "icone": "al-esq"
              },
              {
                "nome": "Ao centro",
                "icone": "al-centroH"
              },
              {
                "nome": "À direita",
                "icone": "al-dir"
              },
              {
                "nome": "Ao topo",
                "icone": "al-topo"
              },
              {
                "nome": "Ao meio",
                "icone": "al-centroV"
              },
              {
                "nome": "À base",
                "icone": "al-base"
              },
              {
                "nome": "Distribuir na horizontal",
                "icone": "distH"
              },
              {
                "nome": "Distribuir na vertical",
                "icone": "distV"
              }
            ]
          },
          {
            "id": "f-girar",
            "nome": "Girar",
            "icone": "girar",
            "tam": "pequeno",
            "menu": true,
            "sub": [
              {
                "nome": "Girar 90° à direita",
                "icone": "girar"
              },
              {
                "nome": "Girar 90° à esquerda",
                "icone": "girarEsq"
              },
              {
                "nome": "Espelhar horizontal",
                "icone": "espelharH"
              },
              {
                "nome": "Espelhar vertical",
                "icone": "espelharV"
              }
            ]
          },
          {
            "id": "f-exc",
            "nome": "Excluir",
            "icone": "excluir",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Tamanho e posição",
        "comandos": [
          {
            "id": "t-alt",
            "nome": "Altura",
            "icone": "altura",
            "tam": "pequeno"
          },
          {
            "id": "t-larg",
            "nome": "Largura",
            "icone": "largura",
            "tam": "pequeno"
          },
          {
            "id": "t-x",
            "nome": "Posição X",
            "icone": "mao",
            "tam": "pequeno"
          },
          {
            "id": "t-y",
            "nome": "Posição Y",
            "icone": "mao",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Comportamento",
        "comandos": [
          {
            "id": "f-cmp-estados",
            "nome": "Estados",
            "icone": "estados",
            "tam": "pequeno"
          },
          {
            "id": "f-cmp-eventos",
            "nome": "Eventos",
            "icone": "raio",
            "tam": "pequeno"
          },
          {
            "id": "f-cmp-resp",
            "nome": "Responsivo",
            "icone": "telaCheia",
            "tam": "pequeno"
          },
          {
            "id": "f-cmp-acess",
            "nome": "Acessibilidade",
            "icone": "acess",
            "tam": "pequeno"
          },
          {
            "id": "f-cmp-insp",
            "nome": "Inspetor completo",
            "icone": "propriedades",
            "tam": "pequeno"
          }
        ]
      },
      {
        "nome": "Componente",
        "comandos": [
          {
            "id": "f-reconhecer",
            "nome": "Reconhecer componente",
            "icone": "buscar",
            "tam": "pequeno"
          },
          {
            "id": "f-vincular",
            "nome": "Vincular a ferramenta…",
            "icone": "link",
            "tam": "pequeno"
          }
        ]
      }
    ]
  }
];
