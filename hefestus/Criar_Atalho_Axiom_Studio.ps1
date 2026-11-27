# Cria os atalhos "Axiom Studio" e "HeartPulse NOC" na Area de Trabalho, com o icone do sistema.
$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcher = Join-Path $projectDir 'Iniciar_Axiom_Studio.bat'
if (-not (Test-Path -LiteralPath $launcher)) { throw "Inicializador nao encontrado: $launcher" }

$desktop = [Environment]::GetFolderPath('Desktop')
if ([string]::IsNullOrWhiteSpace($desktop) -or -not (Test-Path -LiteralPath $desktop)) {
    $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
if (-not (Test-Path -LiteralPath $desktop)) { New-Item -ItemType Directory -Path $desktop | Out-Null }

function New-AxShortcut($name, $arguments, $icon, $description) {
    $path = Join-Path $desktop ($name + '.lnk')
    $shell = New-Object -ComObject WScript.Shell
    $s = $shell.CreateShortcut($path)
    $s.TargetPath = $launcher
    $s.Arguments = $arguments
    $s.WorkingDirectory = $projectDir
    $s.Description = $description
    $s.WindowStyle = 7   # console minimizado; o que aparece e a janela do aplicativo
    $iconPath = Join-Path $projectDir $icon
    if (Test-Path -LiteralPath $iconPath) { $s.IconLocation = "$iconPath,0" } else { $s.IconLocation = "$env:SystemRoot\System32\shell32.dll,21" }
    $s.Save()
    Write-Host "Atalho criado: $path"
}

New-AxShortcut 'Axiom Studio' '' 'axiom.ico' 'Editor e painel NOC Axiom Studio'
New-AxShortcut 'HeartPulse NOC' 'heartpulse' 'heartpulse.ico' 'Painel final HeartPulse NOC (gerado pelo Axiom Studio)'

# Atualiza o cache de icones do Explorer para o novo icone aparecer na hora.
try { & ie4uinit.exe -show } catch {}
