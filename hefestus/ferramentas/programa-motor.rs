//! Motor do programa: diálogos de arquivo e execução de um motor de linha de comando
//! que recebe um contrato JSON (num arquivo) e responde em JSON na saída padrão.
//! Gerado pelo Hefestus para programas com ligações (ligacoes.json).

use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Configuração padrão do motor, vinda do arquivo de ligações na exportação.
const MOTOR_PADRAO: &str = include_str!("../motor-padrao.json");
/// Maior documento que o visualizador aceita (bytes).
const LIMITE_DOCUMENTO: u64 = 512 * 1024 * 1024;

#[derive(serde::Deserialize, serde::Serialize, Clone, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct ConfigMotor {
    pub nome: String,
    pub executavel: String,
    pub ambiente: HashMap<String, String>,
    pub caminho_extra: Vec<String>,
}

#[derive(serde::Deserialize)]
pub struct Filtro {
    pub nome: String,
    pub extensoes: Vec<String>,
}

fn arquivo_config(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("motor.json"))
}

/// A configuração salva pelo usuário (Localizar motor…) vale sobre a padrão.
fn config(app: &tauri::AppHandle) -> Result<ConfigMotor, String> {
    let padrao: ConfigMotor = serde_json::from_str(MOTOR_PADRAO).map_err(|e| e.to_string())?;
    let salvo = arquivo_config(app)
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|t| serde_json::from_str::<ConfigMotor>(&t).ok());
    let mut c = match salvo {
        Some(s) if !s.executavel.is_empty() => s,
        _ => padrao,
    };
    // Caminhos relativos pertencem ao pacote instalado, nunca à pasta do usuário.
    let recursos = app.path().resource_dir().map_err(|e| e.to_string())?;
    if !c.executavel.is_empty() && !Path::new(&c.executavel).is_absolute() {
        c.executavel = recursos.join(&c.executavel).to_string_lossy().into_owned();
    }
    for p in &mut c.caminho_extra {
        if !Path::new(p).is_absolute() { *p = recursos.join(&*p).to_string_lossy().into_owned(); }
    }
    for v in c.ambiente.values_mut() {
        if let Some(p) = v.strip_prefix("recurso:") {
            *v = recursos.join(p).to_string_lossy().into_owned();
        }
    }
    Ok(c)
}

#[tauri::command]
pub fn motor_configuracao(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let c = config(&app)?;
    let existe = Path::new(&c.executavel).is_file();
    Ok(serde_json::json!({ "nome": c.nome, "executavel": c.executavel, "existe": existe }))
}

#[tauri::command]
pub fn motor_definir(app: tauri::AppHandle, executavel: String) -> Result<(), String> {
    if !Path::new(&executavel).is_file() {
        return Err("Arquivo não encontrado.".into());
    }
    let mut c = config(&app)?;
    c.executavel = executavel;
    let texto = serde_json::to_string_pretty(&c).map_err(|e| e.to_string())?;
    fs::write(arquivo_config(&app)?, texto).map_err(|e| e.to_string())
}

/// Roda o motor com o contrato e devolve o JSON que ele respondeu.
#[tauri::command]
pub async fn motor_executar(
    app: tauri::AppHandle,
    contrato: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let c = config(&app)?;
    if !Path::new(&c.executavel).is_file() {
        return Err(format!("Motor não encontrado: {}", c.executavel));
    }
    let temporaria = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&temporaria).map_err(|e| e.to_string())?;
    let marca = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let arquivo = temporaria.join(format!("contrato-{marca}.json"));
    fs::write(
        &arquivo,
        serde_json::to_vec(&contrato).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    let mut cmd = Command::new(&c.executavel);
    cmd.arg(&arquivo);
    if let Some(pasta) = Path::new(&c.executavel).parent() {
        cmd.current_dir(pasta);
    }
    for (k, v) in &c.ambiente {
        cmd.env(k, v);
    }
    if !c.caminho_extra.is_empty() {
        let atual = std::env::var("PATH").unwrap_or_default();
        cmd.env("PATH", format!("{};{}", c.caminho_extra.join(";"), atual));
    }
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW: sem janela de console
    }
    let executavel = c.executavel.clone();
    let saida = tauri::async_runtime::spawn_blocking(move || cmd.output())
        .await
        .map_err(|e| e.to_string())?
        .map_err(|e| format!("Não consegui iniciar o motor ({executavel}): {e}"));
    let _ = fs::remove_file(&arquivo);
    let saida = saida?;

    let ultima_json = |bytes: &[u8]| -> Option<serde_json::Value> {
        String::from_utf8_lossy(bytes)
            .lines()
            .rev()
            .find_map(|l| serde_json::from_str::<serde_json::Value>(l.trim()).ok())
    };
    if saida.status.success() {
        ultima_json(&saida.stdout).ok_or_else(|| "O motor não respondeu em JSON.".to_string())
    } else {
        let erro = ultima_json(&saida.stderr)
            .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(String::from))
            .unwrap_or_else(|| String::from_utf8_lossy(&saida.stderr).trim().to_string());
        Err(if erro.is_empty() {
            format!("O motor terminou com erro ({}).", saida.status)
        } else {
            erro
        })
    }
}

fn caminhos(lista: Vec<tauri_plugin_dialog::FilePath>) -> Result<Vec<String>, String> {
    lista
        .into_iter()
        .map(|f| {
            f.into_path()
                .map(|p| p.display().to_string())
                .map_err(|e| e.to_string())
        })
        .collect()
}

/// Diálogo "Abrir" do Windows. Lista vazia se cancelar.
#[tauri::command]
pub async fn escolher_arquivos(
    app: tauri::AppHandle,
    titulo: String,
    filtros: Vec<Filtro>,
    varios: bool,
) -> Result<Vec<String>, String> {
    let mut d = app.dialog().file().set_title(&titulo);
    for f in &filtros {
        let ext: Vec<&str> = f.extensoes.iter().map(String::as_str).collect();
        d = d.add_filter(&f.nome, &ext);
    }
    if varios {
        caminhos(d.blocking_pick_files().unwrap_or_default())
    } else {
        caminhos(d.blocking_pick_file().into_iter().collect())
    }
}

/// Diálogo "Salvar como" do Windows. Nulo se cancelar.
#[tauri::command]
pub async fn escolher_destino(
    app: tauri::AppHandle,
    titulo: String,
    nome_sugerido: String,
    filtros: Vec<Filtro>,
) -> Result<Option<String>, String> {
    let mut d = app
        .dialog()
        .file()
        .set_title(&titulo)
        .set_file_name(&nome_sugerido);
    for f in &filtros {
        let ext: Vec<&str> = f.extensoes.iter().map(String::as_str).collect();
        d = d.add_filter(&f.nome, &ext);
    }
    match d.blocking_save_file() {
        Some(f) => Ok(Some(
            f.into_path()
                .map_err(|e| e.to_string())?
                .display()
                .to_string(),
        )),
        None => Ok(None),
    }
}

/// Extensão do arquivo, em minúsculas.
fn extensao(p: &Path) -> String {
    p.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase()
}

/// Documentos e imagens que o programa pode ler e gravar.
const LEITURA: &[&str] = &["pdf", "png", "jpg", "jpeg", "bmp", "gif", "webp"];
const GRAVACAO: &[&str] = &["pdf", "png", "jpg", "jpeg"];

/// Lê um documento (PDF) ou uma imagem escolhida no diálogo, até 512 MB.
#[tauri::command]
pub fn ler_documento(caminho: String) -> Result<tauri::ipc::Response, String> {
    let p = Path::new(&caminho);
    if !LEITURA.contains(&extensao(p).as_str()) {
        return Err("Só abro PDF e imagens (png, jpg, bmp, gif, webp).".into());
    }
    let tamanho = fs::metadata(p).map_err(|e| e.to_string())?.len();
    if tamanho > LIMITE_DOCUMENTO {
        return Err("Documento grande demais para o visualizador (mais de 512 MB).".into());
    }
    Ok(tauri::ipc::Response::new(
        fs::read(p).map_err(|e| e.to_string())?,
    ))
}

/// Grava um resultado de texto (txt, md) escolhido no diálogo "Salvar como".
#[tauri::command]
pub fn salvar_texto(caminho: String, conteudo: String) -> Result<(), String> {
    if !["txt", "md", "json", "csv"].contains(&extensao(Path::new(&caminho)).as_str()) {
        return Err("Só grava texto (.txt, .md, .json, .csv).".into());
    }
    fs::write(&caminho, conteudo.as_bytes()).map_err(|e| e.to_string())
}

/// "%C3%81rea" → "Área" (o caminho vem codificado no cabeçalho da chamada).
fn decodificar(texto: &str) -> String {
    let b = texto.as_bytes();
    let mut out = Vec::with_capacity(b.len());
    let mut i = 0;
    while i < b.len() {
        if b[i] == b'%' && i + 2 < b.len() {
            let hex = std::str::from_utf8(&b[i + 1..i + 3]).unwrap_or("");
            if let Ok(v) = u8::from_str_radix(hex, 16) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(b[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn corpo(request: &tauri::ipc::Request<'_>) -> Result<Vec<u8>, String> {
    match request.body() {
        tauri::ipc::InvokeBody::Raw(dados) => Ok(dados.clone()),
        _ => Err("Conteúdo inválido (esperava bytes).".into()),
    }
}

fn cabecalho(request: &tauri::ipc::Request<'_>, nome: &str) -> Option<String> {
    request
        .headers()
        .get(nome)
        .and_then(|v| v.to_str().ok())
        .map(decodificar)
}

/// Grava bytes (PDF editado em memória, imagens de páginas) no caminho escolhido no diálogo "Salvar como".
#[tauri::command]
pub fn salvar_bytes(request: tauri::ipc::Request<'_>) -> Result<(), String> {
    let caminho = cabecalho(&request, "caminho").ok_or("Falta o caminho.")?;
    if !GRAVACAO.contains(&extensao(Path::new(&caminho)).as_str()) {
        return Err("Só grava PDF e imagens (.pdf, .png, .jpg).".into());
    }
    fs::write(&caminho, corpo(&request)?).map_err(|e| format!("Não consegui gravar {caminho}: {e}"))
}

/// Grava a versão atual do documento numa pasta temporária, para o motor externo ler do disco.
#[tauri::command]
pub fn gravar_temporario(
    app: tauri::AppHandle,
    request: tauri::ipc::Request<'_>,
) -> Result<String, String> {
    let ext = cabecalho(&request, "extensao").unwrap_or_else(|| "pdf".into());
    if !GRAVACAO.contains(&ext.as_str()) {
        return Err("Extensão inválida.".into());
    }
    let dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| e.to_string())?
        .join("documentos");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    // limpa versões antigas (mais de um dia)
    if let Ok(itens) = fs::read_dir(&dir) {
        for item in itens.flatten() {
            let velho = item
                .metadata()
                .and_then(|m| m.modified())
                .ok()
                .and_then(|t| t.elapsed().ok())
                .map(|d| d.as_secs() > 86_400)
                .unwrap_or(false);
            if velho {
                let _ = fs::remove_file(item.path());
            }
        }
    }
    let marca = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let arquivo = dir.join(format!("documento-{marca}.{ext}"));
    fs::write(&arquivo, corpo(&request)?).map_err(|e| e.to_string())?;
    Ok(arquivo.display().to_string())
}

/// Fecha o programa.
#[tauri::command]
pub fn sair(app: tauri::AppHandle) {
    app.exit(0);
}
