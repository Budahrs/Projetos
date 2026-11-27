import { validarTemaCompartilhado } from "./temasCompartilhados.js";
function gerarAdaptadoresTemas(pacote){
 if(pacote?.formato!=='hefestus.temas'||pacote.versao!==1||!Array.isArray(pacote.temas)||pacote.temas.length>100)throw Error('Catálogo incompatível.');
 for(const t of pacote.temas){const erros=validarTemaCompartilhado(t);if(erros.length)throw Error(erros.join(' '));}
 const css=pacote.temas.map(t=>`[data-hefestus-tema="${t.id}"]{${Object.entries(t.tokens).map(([k,v])=>`--hf-${k}:${v}`).join(';')}}`).join('\n');
 const xaml=t=>`<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">${Object.entries(t.tokens).map(([k,v])=>`<SolidColorBrush x:Key="Hefestus.${k}" Color="${v}"/>`).join('')}</ResourceDictionary>`;
 const python=`"""Adaptador do catálogo Hefestus. Não recolore documentos/canvas de conteúdo."""
\x69mport json
from pathlib import Path
def carregar(caminho):
    p=json.loads(Path(caminho).read_text(encoding='utf-8-sig'))
    if p.get('formato')!='hefestus.temas' or p.get('versao')!=1: raise ValueError('Catálogo incompatível')
    return {t['id']:t for t in p['temas']}
def modo_sistema():
    try:
        \x69mport ctypes,winreg
        class HIGHCONTRAST(ctypes.Structure):
            _fields_=[('cbSize',ctypes.c_uint),('dwFlags',ctypes.c_uint),('lpszDefaultScheme',ctypes.c_wchar_p)]
        high=HIGHCONTRAST();high.cbSize=ctypes.sizeof(high)
        ctypes.windll.user32.SystemParametersInfoW(0x0042,high.cbSize,ctypes.byref(high),0)
        if high.dwFlags & 1:return 'highContrast'
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER,r'Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize') as key:
            return 'light' if winreg.QueryValueEx(key,'AppsUseLightTheme')[0] else 'dark'
    except (ImportError,OSError,AttributeError): return 'light'
def aplicar(root,catalogo,escolha='automatico'):
    from tkinter import ttk
    t=catalogo[modo_sistema() if escolha in ('automatico','system') else escolha]['tokens']
    s=ttk.Style(root);s.theme_use('clam');root.configure(bg=t['interface'])
    s.configure('.',background=t['painel'],foreground=t['texto'])
    s.configure('TEntry',fieldbackground=t['painel'],foreground=t['texto'])
    s.configure('Treeview',background=t['painel'],fieldbackground=t['painel'],foreground=t['texto'])
    s.map('Treeview',background=[('selected',t['selecao'])],foreground=[('selected',t['texto'])])
    return t
`;
 const arquivos={'temas.json':JSON.stringify(pacote,null,2),'temas.css':css,'temas_tk.py':python,'LEIA-ME.md':'# Adaptadores compartilhados\n\nWeb: importe temas.css e defina data-hefestus-tema. Tk: carregar() e aplicar() em preferências/alterações de SO. WPF: mescle o ResourceDictionary da escolha em Application.Resources e use DynamicResource Hefestus.*. Cada consumidor deve preservar a cor do documento. Estes arquivos não instalam nem modificam outros aplicativos automaticamente. Nenhum teste executado.'};
 for(const t of pacote.temas)arquivos['wpf/'+t.id+'.xaml']=xaml(t);
 return {formato:'hefestus.arquivos',versao:1,projeto:'temas-compartilhados',arquivos};
}
export { gerarAdaptadoresTemas };
