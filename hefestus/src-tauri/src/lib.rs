// Hefestus em janela própria (Tauri 2).
// A interface é o mesmo dist/hefestus.html gerado por `node build.mjs`.
// Este arquivo é o "motor": aqui entram, com o tempo, as partes em Rust (ArtCraft e as suas).

use std::{
    collections::HashSet,
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
    thread,
    time::Duration,
};
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::{DialogExt, FilePath};
use tauri_plugin_fs::{FsExt, OpenOptions};

/// Ferramentas incorporadas do Craft (src-tauri/craft/).
mod craft_vetor;

/// Operação booleana exata entre caminhos SVG (FigCraft pathops).
#[tauri::command]
fn craft_booleana(caminhos: Vec<String>, operacao: String) -> Result<String, String> {
    craft_vetor::booleana(&caminhos, &operacao)
}

/// Converter traço em forma (FigCraft pathops::stroke_outline).
#[tauri::command]
fn craft_contornar_traco(caminho: String, traco: craft_vetor::Traco) -> Result<String, String> {
    craft_vetor::contornar_traco(&caminho, &traco)
}

/// Ponte injetada antes do Hefestus carregar: espelha o projeto no disco e
/// só mostra a janela depois que a tela foi desenhada.
const PONTE: &str = include_str!("../ponte.js");

/// Pasta de dados do Hefestus (%APPDATA%\br.hefestus.editor no Windows).
fn pasta_dados(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Grava o projeto em disco sem risco de arquivo pela metade:
/// escreve num temporário, guarda a versão anterior e troca.
#[tauri::command]
fn salvar_disco(app: tauri::AppHandle, conteudo: String) -> Result<(), String> {
    let dir = pasta_dados(&app)?;
    let atual = dir.join("projeto.json");
    let temporario = dir.join("projeto.json.tmp");
    fs::write(&temporario, conteudo.as_bytes()).map_err(|e| e.to_string())?;
    if atual.exists() {
        let _ = fs::copy(&atual, dir.join("projeto.anterior.json"));
    }
    fs::rename(&temporario, &atual).map_err(|e| e.to_string())
}

/// Grava um arquivo de projeto sem risco de ficar pela metade (temporário + troca).
fn gravar_seguro(caminho: &Path, conteudo: &str) -> Result<(), String> {
    let temporario = caminho.with_extension("hefestus.tmp");
    fs::write(&temporario, conteudo.as_bytes()).map_err(|e| e.to_string())?;
    fs::rename(&temporario, caminho).map_err(|e| e.to_string())
}

/// Endereços content:// que o usuário escolheu num diálogo nesta sessão (Android).
/// Só eles podem ser regravados depois por `gravar_arquivo`.
#[derive(Default)]
struct Concedidos(Mutex<HashSet<String>>);

fn conceder(app: &tauri::AppHandle, endereco: &str) {
    if let Ok(mut lista) = app.state::<Concedidos>().0.lock() {
        lista.insert(endereco.to_string());
    }
}

/// Grava num endereço content:// do Android (o plugin fs abre pelo ContentResolver).
fn gravar_uri(app: &tauri::AppHandle, alvo: FilePath, conteudo: &str) -> Result<(), String> {
    let mut opcoes = OpenOptions::new();
    opcoes.write(true).truncate(true).create(true);
    let mut arquivo = app.fs().open(alvo, opcoes).map_err(|e| e.to_string())?;
    arquivo.write_all(conteudo.as_bytes()).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
struct ArquivoAberto {
    caminho: String,
    conteudo: String,
}

/// Diálogo "Abrir" (Windows ou seletor de arquivos do Android). Devolve null se o usuário cancelar.
/// É async para o diálogo não travar a janela.
#[tauri::command]
async fn abrir_projeto_dialogo(app: tauri::AppHandle) -> Result<Option<ArquivoAberto>, String> {
    let dialogo = app.dialog().file().set_title("Abrir projeto do Hefestus");
    // No Android os filtros viram tipos MIME, e .hefestus não tem um: o filtro esconderia os projetos.
    #[cfg(desktop)]
    let dialogo = dialogo.add_filter("Projeto Hefestus", &["hefestus", "json"]);
    let Some(arquivo) = dialogo.blocking_pick_file() else {
        return Ok(None);
    };
    let caminho = arquivo.to_string();
    let conteudo = app.fs().read_to_string(arquivo).map_err(|e| e.to_string())?;
    conceder(&app, &caminho);
    Ok(Some(ArquivoAberto { caminho, conteudo }))
}

/// Diálogo "Salvar como". Grava e devolve o caminho (ou endereço content://) escolhido, ou null se cancelar.
#[tauri::command]
async fn salvar_projeto_dialogo(
    app: tauri::AppHandle,
    nome_sugerido: String,
    conteudo: String,
) -> Result<Option<String>, String> {
    let mut nome = nome_sugerido;
    if !nome.to_lowercase().ends_with(".hefestus") {
        nome.push_str(".hefestus");
    }
    let dialogo = app
        .dialog()
        .file()
        .set_title("Salvar projeto do Hefestus")
        .set_file_name(&nome);
    #[cfg(desktop)]
    let dialogo = dialogo.add_filter("Projeto Hefestus", &["hefestus"]);
    let Some(arquivo) = dialogo.blocking_save_file() else {
        return Ok(None);
    };
    match arquivo {
        FilePath::Path(mut caminho) => {
            if caminho.extension().is_none() {
                caminho.set_extension("hefestus");
            }
            gravar_seguro(&caminho, &conteudo)?;
            Ok(Some(caminho.display().to_string()))
        }
        endereco => {
            let texto = endereco.to_string();
            gravar_uri(&app, endereco, &conteudo)?;
            conceder(&app, &texto);
            Ok(Some(texto))
        }
    }
}

/// Ctrl+S depois do primeiro "Salvar como": grava direto no mesmo arquivo.
#[tauri::command]
fn gravar_arquivo(app: tauri::AppHandle, caminho: String, conteudo: String) -> Result<(), String> {
    if caminho.starts_with("content://") {
        let concedido = app.state::<Concedidos>().0.lock().map(|l| l.contains(&caminho)).unwrap_or(false);
        if !concedido {
            return Err("Escolha o arquivo de novo em Salvar como.".into());
        }
        let endereco = tauri::Url::parse(&caminho).map_err(|e| e.to_string())?;
        return gravar_uri(&app, FilePath::Url(endereco), &conteudo);
    }
    let caminho = PathBuf::from(caminho);
    let extensao = caminho.extension().and_then(|e| e.to_str()).unwrap_or("");
    if extensao != "hefestus" && extensao != "json" {
        return Err("Só grava arquivos .hefestus ou .json.".into());
    }
    gravar_seguro(&caminho, &conteudo)
}

#[tauri::command]
fn mostrar_janela(window: tauri::WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
struct InfoMotor {
    versao: String,
    pasta_dados: String,
    craft: Vec<&'static str>,
}

/// Exemplo de comando em linguagem de máquina: devolve JSON para a interface.
#[tauri::command]
fn info_motor(app: tauri::AppHandle) -> Result<InfoMotor, String> {
    Ok(InfoMotor {
        versao: app.package_info().version.to_string(),
        pasta_dados: pasta_dados(&app)?.display().to_string(),
        craft: craft_vetor::FERRAMENTAS.to_vec(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Concedidos::default())
        .invoke_handler(tauri::generate_handler![
            salvar_disco,
            mostrar_janela,
            info_motor,
            abrir_projeto_dialogo,
            salvar_projeto_dialogo,
            gravar_arquivo,
            craft_booleana,
            craft_contornar_traco
        ])
        .setup(|app| {
            // O projeto salvo em disco entra antes do Hefestus ler o localStorage.
            let dir = pasta_dados(app.handle())?;
            let salvo: Option<String> = fs::read_to_string(dir.join("projeto.json")).ok();
            let literal = serde_json::to_string(&salvo)?;
            let abrir = std::env::args().skip(1).find(|p| p.to_lowercase().ends_with(".hefestus"))
                .and_then(|p| fs::read_to_string(p).ok());
            let arquivo_inicial = serde_json::to_string(&abrir)?;
            let script = format!("window.__HEFESTUS_DISCO__ = {literal};\nwindow.__HEFESTUS_ARQUIVO_INICIAL__ = {arquivo_inicial};\n{PONTE}");

            let janela =
                WebviewWindowBuilder::new(app, "main", WebviewUrl::App("hefestus.html".into()))
                    .title("Hefestus")
                    .inner_size(1440.0, 900.0)
                    .min_inner_size(1024.0, 640.0)
                    .visible(false)
                    .initialization_script(&script)
                    .build()?;

            // Reserva: se a ponte não pedir para mostrar em 5 s, mostra assim mesmo.
            let reserva = janela.clone();
            thread::spawn(move || {
                thread::sleep(Duration::from_secs(5));
                if !reserva.is_visible().unwrap_or(true) {
                    let _ = reserva.show();
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o Hefestus");
}
