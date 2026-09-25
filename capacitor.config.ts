import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.kelolakost",
  appName: "Kelola Kost",
  webDir: "public",
  server: {
    // Ganti dengan URL situs yang sudah dipublikasikan sebelum rilis ke Play Store.
    url: "https://id-preview--6b9c707a-c3f9-47f1-a799-dafb4548c6de.lovable.app",
    cleartext: true,
  },
};

export default config;
