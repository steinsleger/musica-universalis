import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import removeConsole from "vite-plugin-remove-console";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    plugins: [
      react(),
      isProduction && removeConsole(),
      mode === "analyze" &&
        visualizer({
          filename: "bundle-analysis.html",
          // open: true, // opens automatically
          gzipSize: true,
          brotliSize: true,
        }),
    ],
    build: {
      // Enable minification settings for production
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
      // CSS minification is enabled by default
      cssMinify: true,
      // HTML minification settings
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
        },
      },
    },
  };
});
