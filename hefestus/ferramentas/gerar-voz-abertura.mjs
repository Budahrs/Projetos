// Gera a voz "Hephaestus" da abertura com a voz pt-BR "Daniel" do próprio Windows (offline)
// e grava js/ui/vozAbertura.js com o WAV embutido, para funcionar em file://, na janela e no Android.
// Uso (só no Windows): node ferramentas/gerar-voz-abertura.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = mkdtempSync(join(tmpdir(), "hephaestus-voz-"));
const bruto = join(pasta, "voz.wav");

// IPA para soar "he-FÉS-tus" e não "e-fes-TUS" (o português lê o H mudo e acentua o -us final).
const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="pt-BR"><prosody rate="-15%" pitch="-10%"><phoneme alphabet="ipa" ph="heˈfɛstus">Hephaestus</phoneme></prosody></speak>`;
const ps = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
function Esperar($op, [Type]$tipo) { $t = $asTask.MakeGenericMethod($tipo).Invoke($null, @($op)); $t.Wait(); $t.Result }
$s = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$voz = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like '*Daniel*' } | Select-Object -First 1
if (-not $voz) { throw 'Voz Microsoft Daniel (pt-BR) não instalada.' }
$s.Voice = $voz
$stream = Esperar ($s.SynthesizeSsmlToStreamAsync($env:HEPHAESTUS_SSML)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
$r = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
$n = [uint32]$stream.Size
$null = Esperar ($r.LoadAsync($n)) ([uint32])
$bytes = New-Object byte[] $n
$r.ReadBytes($bytes)
[IO.File]::WriteAllBytes($env:HEPHAESTUS_SAIDA, $bytes)
`;
execFileSync("powershell", ["-NoProfile", "-Command", ps], { env: { ...process.env, HEPHAESTUS_SSML: ssml, HEPHAESTUS_SAIDA: bruto }, stdio: "inherit" });

// WAV PCM 16 bits mono: acha o bloco "data", corta o silêncio e normaliza o pico em -3 dB.
const wav = readFileSync(bruto);
rmSync(pasta, { recursive: true, force: true });
const taxa = wav.readUInt32LE(24);
if (wav.readUInt16LE(22) !== 1 || wav.readUInt16LE(34) !== 16) throw new Error("WAV inesperado (esperava mono 16 bits).");
let p = 12;
while (wav.toString("ascii", p, p + 4) !== "data") p += 8 + wav.readUInt32LE(p + 4);
const amostras = new Int16Array(wav.buffer.slice(wav.byteOffset + p + 8, wav.byteOffset + p + 8 + wav.readUInt32LE(p + 4)));
const ativos = amostras.reduce((a, v, i) => (Math.abs(v) > 600 ? [a[0] ?? i, i] : a), []);
const ini = Math.max(0, ativos[0] - Math.round(taxa * 0.04)), fim = Math.min(amostras.length, ativos[1] + Math.round(taxa * 0.12));
const trecho = amostras.slice(ini, fim);
const ganho = (32767 * 0.708) / Math.max(...trecho.map(Math.abs));
const saida = Buffer.alloc(44 + trecho.length * 2);
saida.write("RIFF", 0); saida.writeUInt32LE(36 + trecho.length * 2, 4); saida.write("WAVEfmt ", 8);
saida.writeUInt32LE(16, 16); saida.writeUInt16LE(1, 20); saida.writeUInt16LE(1, 22); saida.writeUInt32LE(taxa, 24);
saida.writeUInt32LE(taxa * 2, 28); saida.writeUInt16LE(2, 32); saida.writeUInt16LE(16, 34);
saida.write("data", 36); saida.writeUInt32LE(trecho.length * 2, 40);
trecho.forEach((v, i) => saida.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * ganho))), 44 + i * 2));

writeFileSync(join(raiz, "js/ui/vozAbertura.js"), `// Gerado por ferramentas/gerar-voz-abertura.mjs (voz Microsoft Daniel pt-BR). Não editar à mão.
export const VOZ_HEPHAESTUS = "data:audio/wav;base64,${saida.toString("base64")}";
`);
console.log(`js/ui/vozAbertura.js: ${(trecho.length / taxa).toFixed(2)} s, ${(saida.length / 1024).toFixed(0)} KB`);
