import { defineConfig } from "vite";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

// Collect all HTML files in pages/ as MPA inputs
function getHelpPageInputs(): Record<string, string> {
  const pagesDir = resolve(__dirname, "pages");
  const inputs: Record<string, string> = {};

  try {
    for (const file of readdirSync(pagesDir)) {
      if (file.endsWith(".html")) {
        const name = file.replace(".html", "");
        inputs[name] = resolve(pagesDir, file);
      }
    }
  } catch {
    // pages/ doesn't exist yet (prebuild hasn't run)
  }

  return inputs;
}

export default defineConfig({
  root: resolve(__dirname, "pages"),
  base: "/vscode-railsim-grammer/help/",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: getHelpPageInputs(),
    },
  },
});
