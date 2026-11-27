// Prepara o projeto Android do Hephaestus (Tauri 2). Rode uma vez depois de instalar
// Android Studio (SDK + NDK), JDK e Rust com os alvos Android. Pode rodar de novo sem estragar nada.
// Uso: npm run android:preparar   →   depois: npm run android:dev  ou  npm run android:apk
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rodar = cmd => execSync(cmd, { cwd: raiz, stdio: "inherit" });

const faltando = [];
if (!process.env.ANDROID_HOME) faltando.push("ANDROID_HOME (pasta do Android SDK)");
if (!process.env.NDK_HOME) faltando.push("NDK_HOME (pasta do NDK, dentro do SDK em ndk/<versão>)");
if (!process.env.JAVA_HOME) faltando.push("JAVA_HOME (o JBR do Android Studio serve)");
try { execSync("rustup --version", { stdio: "ignore" }); } catch { faltando.push("Rust (rustup)"); }
if (faltando.length) {
  console.error("Falta configurar:\n- " + faltando.join("\n- "));
  process.exit(1);
}
rodar("rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android");

const android = join(raiz, "src-tauri/gen/android");
if (!existsSync(android)) rodar("npx tauri android init");
rodar("npx tauri icon src-tauri/icons/icon.png");

// A abertura toca marteladas e a voz sem esperar um toque: a WebView do Android
// bloqueia som sem gesto por padrão. (Sem este ajuste, a abertura pede um toque.)
const achar = pasta => readdirSync(pasta, { withFileTypes: true }).flatMap(f => f.isDirectory() ? achar(join(pasta, f.name)) : f.name === "MainActivity.kt" ? [join(pasta, f.name)] : []);
const [atividade] = achar(join(android, "app/src/main/java"));
if (!atividade) throw new Error("MainActivity.kt não encontrado em gen/android.");
let kt = readFileSync(atividade, "utf8");
if (!kt.includes("mediaPlaybackRequiresUserGesture")) {
  const metodo = `  override fun onWebViewCreate(webView: android.webkit.WebView) {
    // Hephaestus: a abertura com sons toca sem esperar um toque.
    webView.settings.mediaPlaybackRequiresUserGesture = false
  }
`;
  if (/class MainActivity\s*:\s*TauriActivity\(\)\s*\{/.test(kt)) kt = kt.replace(/(class MainActivity\s*:\s*TauriActivity\(\)\s*\{[ \t]*\r?\n?)/, m => `${m.trimEnd()}\n${metodo}\n`);
  else if (/class MainActivity\s*:\s*TauriActivity\(\)\s*$/m.test(kt)) kt = kt.replace(/class MainActivity\s*:\s*TauriActivity\(\)\s*$/m, `class MainActivity : TauriActivity() {\n${metodo}}`);
  else throw new Error(`Formato inesperado em ${atividade}; ajuste à mão: ${metodo}`);
  writeFileSync(atividade, kt);
  console.log("MainActivity.kt: som da abertura liberado.");
}
// Assinatura da versão final: a chave fica fora do projeto, em ~/.chaves-android (guarde uma cópia).
const chaves = join(process.env.USERPROFILE ?? process.env.HOME ?? "", ".chaves-android", "keystore.properties");
const gradle = join(android, "app/build.gradle.kts");
if (existsSync(chaves)) {
  writeFileSync(join(android, "keystore.properties"), readFileSync(chaves));
  let g = readFileSync(gradle, "utf8");
  if (!g.includes("signingConfigs")) {
    g = g.replace("    buildTypes {", `    signingConfigs {
        create("release") {
            // Hephaestus: chave em keystore.properties (fora do git; veja ferramentas/preparar-android.mjs)
            val chave = Properties().apply {
                val arquivo = rootProject.file("keystore.properties")
                if (arquivo.exists()) arquivo.inputStream().use { load(it) }
            }
            if (chave.getProperty("storeFile") != null) {
                keyAlias = chave.getProperty("keyAlias")
                keyPassword = chave.getProperty("password")
                storeFile = file(chave.getProperty("storeFile"))
                storePassword = chave.getProperty("password")
            }
        }
    }
    buildTypes {`).replace(`        getByName("release") {\n`, `        getByName("release") {\n            if (rootProject.file("keystore.properties").exists()) signingConfig = signingConfigs.getByName("release")\n`);
    writeFileSync(gradle, g);
    console.log("build.gradle.kts: assinatura da versão final configurada.");
  }
} else console.log(`Sem chave em ${chaves}: a versão final sai sem assinatura.`);
console.log("Pronto. Celular com depuração USB ligada: npm run android:dev. APK: npm run android:apk.");
