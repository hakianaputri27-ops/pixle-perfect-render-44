// Membuat dist/client/index.html dari hasil build agar aplikasi bisa dikemas offline (Android/Capacitor).
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const serverEntry = pathToFileURL(resolve("dist/server/index.mjs")).href;
const { default: app } = await import(serverEntry);
const res = await app.fetch(new Request("http://localhost/"), {}, {
  waitUntil() {},
  passThroughOnException() {},
});
if (!res.ok) throw new Error(`Gagal membuat index.html (status ${res.status})`);
const out = resolve("dist/client/index.html");
writeFileSync(out, await res.text());
console.log("index.html dibuat:", out);
