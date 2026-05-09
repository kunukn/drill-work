import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { fileURLToPath, URL } from "url";
import AutoImport from "unplugin-auto-import/vite";
import { autoImportConfig } from "./auto-import.config.ts";
import { CodeInspectorPlugin } from "code-inspector-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    plugins: [
      // Use Alt + Shift  (Windows) or Option + Shift  (macOS) to turn on or off.
      ...(["1", "true"].includes(env.VITE_CODE_INSPECTOR)
        ? [CodeInspectorPlugin({ bundler: "vite" })]
        : []),
      viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart(),
      nitro({
        rollupConfig: {
          external: (id: string) => id.startsWith("node:"),
        },
      }),
      viteReact(),
      AutoImport({
        imports: autoImportConfig as any,
        dts: true, // generates TypeScript definitions
      }),
    ],
  };
});
