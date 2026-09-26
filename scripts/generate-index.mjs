// Membuat index.html di folder hasil build agar aplikasi bisa dikemas offline (Android/Capacitor).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Lokasi hasil build bisa "dist" (default proyek ini) atau ".output" (default nitro).
const outputDirs = ["dist", ".output"];
const outputDir = outputDirs.find((dir) => existsSync(resolve(dir, "nitro.json")));
if (!outputDir) {
  throw new Error(
    `Hasil build tidak ditemukan. Jalankan "vite build" dulu (dicari di: ${outputDirs.join(", ")}).`,
  );
}

const meta = JSON.parse(readFileSync(resolve(outputDir, "nitro.json"), "utf8"));
const serverEntry = resolve(outputDir, meta.serverEntry ?? "server/index.mjs");
const publicDir = resolve(outputDir, meta.publicDir ?? "client");
if (!existsSync(serverEntry)) throw new Error(`Berkas server tidak ada: ${serverEntry}`);
if (!existsSync(publicDir)) throw new Error(`Folder publik tidak ada: ${publicDir}`);

const mod = await import(pathToFileURL(serverEntry).href);
const app = mod.default ?? mod;
const fetchHandler = typeof app === "function" ? app : app.fetch;
if (typeof fetchHandler !== "function") {
  throw new Error("Titik masuk server tidak menyediakan handler fetch.");
}

const res = await fetchHandler(new Request("http://localhost/"), {}, {
  waitUntil() {},
  passThroughOnException() {},
});
if (!res || !res.ok) {
  throw new Error(`Gagal membuat index.html (status ${res ? res.status : "tidak ada respons"})`);
}

const out = join(publicDir, "index.html");
writeFileSync(out, await res.text());
console.log("index.html dibuat:", out);
