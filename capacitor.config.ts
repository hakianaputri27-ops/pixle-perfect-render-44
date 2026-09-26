import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.kelolakost",
  appName: "Kelola Kost",
  // Hasil "npm run build" (berisi index.html) — aplikasi berjalan offline di HP.
  webDir: "dist/client",
};

export default config;
