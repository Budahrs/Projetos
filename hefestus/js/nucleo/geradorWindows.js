import { CATALOGO_TEMAS } from "./temasCompartilhados.js";
import { validarProjetoFuturo } from "./projetosFuturos.js";
const literal=s=>JSON.stringify(String(s)).replace(/\\u2028/g,' ');
function gerarProjetoWindows(valor){
 const p=validarProjetoFuturo(valor);
 const campos=JSON.stringify(p.campos),itens=JSON.stringify(p.itens);
 const codigo=`using System;
using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Win32;
namespace ProjetoHefestus;
public partial class MainWindow : Window {
 readonly string arquivo=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"HefestusGerados",${literal(p.id)},"dados.txt");
 readonly StackPanel painel=new(){Margin=new Thickness(20)};
 readonly TextBlock estado=new(){TextWrapping=TextWrapping.Wrap,Margin=new Thickness(0,10,0,10)};
 string texto="";
 public MainWindow(){InitializeComponent();Title=${literal(p.nome)};Background=(Brush)new BrushConverter().ConvertFromString(${literal(p.tokens.fundo)})!;Foreground=(Brush)new BrushConverter().ConvertFromString(${literal(p.tokens.texto)})!;Content=new ScrollViewer{Content=painel};AplicarTema();Microsoft.Win32.SystemEvents.UserPreferenceChanged+=PreferenciasMudaram;Closed+=(_,_)=>Microsoft.Win32.SystemEvents.UserPreferenceChanged-=PreferenciasMudaram;painel.Children.Add(new TextBlock{Text=Title,FontSize=24});painel.Children.Add(estado);try{if(File.Exists(arquivo))texto=File.ReadAllText(arquivo);}catch(Exception e){estado.Text=e.Message;}Construir();}
 void PreferenciasMudaram(object sender,Microsoft.Win32.UserPreferenceChangedEventArgs e){Dispatcher.BeginInvoke(new Action(AplicarTema));}
 void AplicarTema(){string id=${literal(p.tema??'automatico')};if(id=="automatico"){bool escuro=false;try{using var chave=Microsoft.Win32.Registry.CurrentUser.OpenSubKey(@"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize");escuro=Convert.ToInt32(chave?.GetValue("AppsUseLightTheme",1))==0;}catch{}id=SystemParameters.HighContrast?"highContrast":escuro?"dark":"light";}var temas=JsonDocument.Parse(${literal(JSON.stringify(CATALOGO_TEMAS))}).RootElement;if(!temas.TryGetProperty(id,out var tema))return;var t=tema.GetProperty("tokens");Brush Cor(string k)=>(Brush)new BrushConverter().ConvertFromString(t.GetProperty(k).GetString()!)!;Resources["Fundo"]=Cor("interface");Resources["Painel"]=Cor("painel");Resources["Texto"]=Cor("texto");Background=(Brush)Resources["Fundo"];Foreground=(Brush)Resources["Texto"];foreach(var tipo in new[]{typeof(TextBox),typeof(Button),typeof(ListBox),typeof(ComboBox)}){var st=new Style(tipo);st.Setters.Add(new Setter(Control.BackgroundProperty,Resources["Painel"]));st.Setters.Add(new Setter(Control.ForegroundProperty,Resources["Texto"]));Resources[tipo]=st;}}
 void Salvar(string valor){texto=valor;try{Directory.CreateDirectory(Path.GetDirectoryName(arquivo)!);File.WriteAllText(arquivo,valor);estado.Text="Salvo localmente";}catch(Exception e){estado.Text="Falha ao salvar: "+e.Message;}}
 Button Acao(string nome,Action fazer){var b=new Button{Content=nome,Padding=new Thickness(10),Margin=new Thickness(0,6,0,6)};b.Click+=(_,_)=>{try{fazer();}catch(Exception e){estado.Text=e.Message;}};painel.Children.Add(b);return b;}
 void Construir(){
 const string tipo=${literal(p.tipo)};
 Acao("Exportar dados",()=>{var d=new SaveFileDialog{Filter="Texto|*.txt",FileName="dados.txt"};if(d.ShowDialog()==true)File.WriteAllText(d.FileName,texto);});
 Acao("Importar dados",()=>{var d=new OpenFileDialog{Filter="Texto|*.txt"};if(d.ShowDialog()==true){var valor=File.ReadAllText(d.FileName);Salvar(valor);estado.Text="Dados importados. Reabra a janela para recarregar os campos.";}});
 if(tipo=="notas"||tipo=="tarefas"){painel.Children.Add(new TextBlock{Text=tipo=="tarefas"?"Uma tarefa por linha; use [ ] e [x] para marcar o estado.":"Sua nota"});var t=new TextBox{Text=texto,AcceptsReturn=true,TextWrapping=TextWrapping.Wrap,MinHeight=320,VerticalScrollBarVisibility=ScrollBarVisibility.Auto};t.TextChanged+=(_,_)=>Salvar(t.Text);painel.Children.Add(t);}
 if(tipo=="calculadora"){TextBox a=new TextBox{Margin=new Thickness(0,6,0,6)},b=new TextBox{Margin=new Thickness(0,6,0,6)};painel.Children.Add(new TextBlock{Text="Sucessos"});painel.Children.Add(a);painel.Children.Add(new TextBlock{Text="Total"});painel.Children.Add(b);Acao("Calcular taxa",()=>{if(!double.TryParse(a.Text,out var x)||!double.TryParse(b.Text,out var y)||y<=0||x<0||x>y)throw new Exception("Informe sucessos entre zero e o total, e total maior que zero.");Salvar($"{100*x/y:F2}% ({x}/{y})");});}
 if(tipo=="formulario"){var campos=JsonDocument.Parse(${literal(campos)}).RootElement;var entradas=new System.Collections.Generic.Dictionary<string,TextBox>();foreach(var c in campos.EnumerateArray()){var id=c.GetProperty("id").GetString()!;painel.Children.Add(new TextBlock{Text=c.GetProperty("rotulo").GetString()});var i=new TextBox{Tag=c.TryGetProperty("obrigatorio",out var req)&&req.GetBoolean(),Margin=new Thickness(0,6,0,6)};entradas[id]=i;painel.Children.Add(i);}Acao("Salvar registro",()=>{var v=new System.Collections.Generic.Dictionary<string,string>();foreach(var kv in entradas){if((bool)kv.Value.Tag&&string.IsNullOrWhiteSpace(kv.Value.Text))throw new Exception("Preencha os campos obrigatórios.");v[kv.Key]=kv.Value.Text;}Salvar(texto+JsonSerializer.Serialize(v)+Environment.NewLine);});}
 if(tipo=="catalogo"){TextBox busca=new TextBox{Margin=new Thickness(0,6,0,6)};var lista=new ListBox{MinHeight=240};painel.Children.Add(new TextBlock{Text="Buscar componentes"});painel.Children.Add(busca);painel.Children.Add(lista);var itens=JsonDocument.Parse(${literal(itens)}).RootElement;void Filtrar(){lista.Items.Clear();foreach(var i in itens.EnumerateArray())if(i.ToString().Contains(busca.Text,StringComparison.OrdinalIgnoreCase))lista.Items.Add(i.ToString());}busca.TextChanged+=(_,_)=>Filtrar();Filtrar();}
 }
}`;
 return {formato:'hefestus.arquivos',versao:1,projeto:p.id,arquivos:{'ProjetoHefestus.csproj':'<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>WinExe</OutputType><TargetFramework>net8.0-windows</TargetFramework><UseWPF>true</UseWPF><Nullable>enable</Nullable></PropertyGroup></Project>','App.xaml':'<Application x:Class="ProjetoHefestus.App" xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml" StartupUri="MainWindow.xaml"/>','App.xaml.cs':'using System.Windows; namespace ProjetoHefestus; public partial class App : Application {}','MainWindow.xaml':'<Window x:Class="ProjetoHefestus.MainWindow" xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml" Width="900" Height="650" MinWidth="400" MinHeight="350"/>','MainWindow.xaml.cs':codigo,'projeto.hefestus.json':JSON.stringify(p,null,2),'LEIA-ME.md':'# Projeto Windows\n\nRequer Windows e SDK .NET 8. Execute dotnet build e dotnet run nesta pasta. Nenhum build ou teste foi executado durante a geração. O quadro Windows usa tarefas em texto; não possui a mesma interface de cartões da versão web. A importação de dados requer reabrir a janela.\n'}};
}
export { gerarProjetoWindows };
