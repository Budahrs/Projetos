// Evita abrir uma janela de console junto no Windows (versão final). Não remover.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    hefestus_lib::run()
}
