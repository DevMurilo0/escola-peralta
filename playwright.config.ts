import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  workers: 1,
  webServer: [
    {
      command: "npm run preview -- --host 127.0.0.1 --port 3100 --strictPort",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: process.env.PERALTA_REUSE_PREVIEW === "1",
      timeout: 120000,
    },
    {
      command: "node tests/browser/fixture-server.mjs",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: false,
    },
  ],
  reporter: "list",
});
