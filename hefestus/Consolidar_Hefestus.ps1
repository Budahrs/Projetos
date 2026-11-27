# Consolidar o Hefestus nesta máquina: uma versão só, com ícone na Área de Trabalho e no menu Iniciar.
# Nada é apagado: as outras cópias vão para Desktop\projetos\_para_apagar_hefestus\<data>.
# Confira o Hefestus novo e, quando estiver tudo certo, apague essa pasta você mesmo.
# Para voltar atrás: rode Desfazer_Consolidacao.ps1 que fica dentro da pasta da quarentena.

$ErrorActionPreference = "Stop"
$versao = "0.34.0"
$perfil = $env:USERPROFILE
$raiz = Join-Path $perfil "Desktop\projetos\Hefestus"
$app = Join-Path $raiz "aplicacao"
$alvo = Join-Path $app "dist\hefestus.html"
$icone = Join-Path $raiz "hefestus.ico"
$carimbo = Get-Date -Format "yyyy-MM-dd_HHmm"
$quarentena = Join-Path $perfil "Desktop\projetos\_para_apagar_hefestus\$carimbo"

if (-not (Test-Path -LiteralPath $alvo)) { Write-Host "Não achei $alvo. Nada foi feito." -ForegroundColor Red; exit 1 }

# ---------- o que é cópia antiga (caminhos a partir da pasta do usuário; * vale como curinga)
$copias = @(
  "Desktop\projetos\Hefestus\hefestus.html",
  "Desktop\projetos\Hefestus\Hefestus_fusao_v0.32.0",
  "Desktop\projetos\Hefestus\Hefestus_Atualizado_2026-10-15.zip",
  "Desktop\projetos\Hefestus\Hefestus-fonte.zip",
  "Desktop\projetos\Hefestus\Hefestus-projeto-completo.zip",
  "Desktop\projetos\Hefestus\backup_antes_*",
  "Desktop\projetos\Hefestus\aplicacao\backup_antes_*",
  "Desktop\projetos\Hefestus\aplicacao\Hefestus-fusao-v0.32.0-projeto.zip",
  "Downloads\hefestus.html",
  "Downloads\hefestus_*.html",
  "Downloads\Hefestus-fusao-v0.32.0-projeto*.zip",
  "Desktop\Hefestus - pasta do projeto.url",
  "Desktop\hefestus.html - Atalho.lnk",
  "Desktop\Hefestus.url",
  "Documents\Codex\2026-10-15\he\work\hefestus",
  "Documents\Codex\2026-10-15\he\outputs\hefestus.html",
  "Documents\Codex\2026-10-15\he\outputs\Hefestus_Atualizado.html",
  "Documents\Codex\2026-10-15\he\outputs\Hefestus-fusao-v0.32.0-projeto.zip",
  "Documents\Codex\2026-10-19\new-chat-2\hefestus-audit",
  "Documents\Codex\2026-10-19\referenced-chatgpt-conversation-this-is-an\work\hefestus"
)

$itens = @()
foreach ($rel in $copias) {
  $pasta = Split-Path (Join-Path $perfil $rel) -Parent
  $nome = Split-Path $rel -Leaf
  if (-not (Test-Path -LiteralPath $pasta)) { continue }
  if ($nome.Contains("*")) { $itens += Get-ChildItem -LiteralPath $pasta -Force | Where-Object { $_.Name -like $nome } | ForEach-Object { $_.FullName } }
  elseif (Test-Path -LiteralPath (Join-Path $pasta $nome)) { $itens += (Join-Path $pasta $nome) }
}

Write-Host ""
Write-Host "Hefestus $versao fica em:" -ForegroundColor Cyan
Write-Host "  $alvo"
Write-Host ""
Write-Host "Cópias antigas encontradas ($($itens.Count)) — vão para a quarentena, nada é apagado:" -ForegroundColor Cyan
$itens | ForEach-Object { Write-Host "  $($_.Substring($perfil.Length + 1))" }
Write-Host ""
$r = Read-Host "Mover essas cópias e criar o ícone único? (S/N)"
if ($r -notmatch '^[sS]') { Write-Host "Cancelado. Nada foi movido."; exit 0 }

New-Item -ItemType Directory -Force -Path $quarentena | Out-Null
$registro = @()
foreach ($origem in $itens) {
  $destino = Join-Path $quarentena $origem.Substring($perfil.Length + 1)
  New-Item -ItemType Directory -Force -Path (Split-Path $destino -Parent) | Out-Null
  try {
    Move-Item -LiteralPath $origem -Destination $destino -Force
    $registro += [pscustomobject]@{ origem = $origem; destino = $destino }
    Write-Host "  movido: $($origem.Substring($perfil.Length + 1))"
  } catch { Write-Host "  NÃO movido (em uso?): $origem — $($_.Exception.Message)" -ForegroundColor Yellow }
}

# projeto salvo que estava em Downloads: é seu trabalho, não cópia do programa
$proj = Join-Path $perfil "Downloads\projeto-sem-titulo.hefestus.json"
if (Test-Path -LiteralPath $proj) {
  $pastaProj = Join-Path $raiz "projetos"
  New-Item -ItemType Directory -Force -Path $pastaProj | Out-Null
  $destProj = Join-Path $pastaProj "projeto-sem-titulo.hefestus.json"
  if (-not (Test-Path -LiteralPath $destProj)) {
    Move-Item -LiteralPath $proj -Destination $destProj
    $registro += [pscustomobject]@{ origem = $proj; destino = $destProj }
    Write-Host "  projeto guardado em: projetos\Hefestus\projetos\projeto-sem-titulo.hefestus.json"
  }
}

if ($registro.Count) { ConvertTo-Json -InputObject @($registro) | Set-Content -LiteralPath (Join-Path $quarentena "registro.json") -Encoding UTF8 }
else { "[]" | Set-Content -LiteralPath (Join-Path $quarentena "registro.json") -Encoding UTF8 }
@'
# Desfaz a consolidação: devolve cada item ao lugar de origem (se o lugar estiver livre).
$reg = Get-Content -LiteralPath (Join-Path $PSScriptRoot "registro.json") -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($i in @($reg)) {
  if ((Test-Path -LiteralPath $i.destino) -and -not (Test-Path -LiteralPath $i.origem)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $i.origem -Parent) | Out-Null
    Move-Item -LiteralPath $i.destino -Destination $i.origem
    Write-Host "devolvido: $($i.origem)"
  }
}
'@ | Set-Content -LiteralPath (Join-Path $quarentena "Desfazer_Consolidacao.ps1") -Encoding UTF8

# ---------- ícone único: Área de Trabalho e menu Iniciar
$ws = New-Object -ComObject WScript.Shell
foreach ($lugar in @([Environment]::GetFolderPath("Desktop"), [Environment]::GetFolderPath("Programs"))) {
  if (-not $lugar) { continue }
  $a = $ws.CreateShortcut((Join-Path $lugar "Hefestus.lnk"))
  $a.TargetPath = $alvo
  $a.WorkingDirectory = Split-Path $alvo -Parent
  if (Test-Path -LiteralPath $icone) { $a.IconLocation = "$icone,0" }
  $a.Description = "Hefestus $versao"
  $a.Save()
}
Write-Host ""
Write-Host "Ícone 'Hefestus' criado na Área de Trabalho e no menu Iniciar." -ForegroundColor Green

# ---------- cópia do GitHub (repositório 'programas'): atualizar para a mesma versão
$repo = Join-Path $perfil "Documents\Codex\github-programas\hefestus"
if (Test-Path -LiteralPath $repo) {
  $g = Read-Host "Atualizar também a pasta do GitHub (Documents\Codex\github-programas\hefestus) para a $versao? (S/N)"
  if ($g -match '^[sS]') {
    foreach ($d in @("js", "css", "testes", "tools", "ferramentas", "licencas", "seed")) {
      if (Test-Path -LiteralPath (Join-Path $app $d)) { robocopy (Join-Path $app $d) (Join-Path $repo $d) /MIR /NFL /NDL /NJH /NJS /NP | Out-Null }
    }
    foreach ($f in @("build.mjs", "index.html", "README.md")) { Copy-Item -LiteralPath (Join-Path $app $f) -Destination (Join-Path $repo $f) -Force }
    Write-Host "Pasta do GitHub atualizada. Para enviar:" -ForegroundColor Green
    Write-Host "  cd `"$((Split-Path $repo -Parent))`""
    Write-Host "  git add hefestus && git commit -m `"Hefestus $versao`" && git push"
  }
}

Write-Host ""
Write-Host "Pronto. Abra o Hefestus pelo ícone e confira seus projetos." -ForegroundColor Green
Write-Host "Quando estiver tudo certo, apague a pasta: $((Split-Path $quarentena -Parent))"
Write-Host "Para voltar atrás: $quarentena\Desfazer_Consolidacao.ps1"
