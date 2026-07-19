import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },

    plugins: [
      react()
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },

    define: {
      "process.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify(
        env.VITE_GOOGLE_MAPS_API_KEY
      ),
      "process.env.VITE_BREVO_API_KEY": JSON.stringify(
        env.VITE_BREVO_API_KEY
      ),
    },

   build: {
  target: "es2019",
  sourcemap: false,
  minify: "esbuild",

  cssCodeSplit: true,

  rollupOptions: {
    output: {
      manualChunks: {
        vendor: [
          "react",
          "react-dom"
        ],
      },

      assetFileNames: (assetInfo) => {
        if (/\.(png|jpe?g|webp|svg|gif)$/i.test(assetInfo.name ?? "")) {
          return "assets/images/[name]-[hash][extname]";
        }

        if (/\.css$/i.test(assetInfo.name ?? "")) {
          return "assets/css/[name]-[hash][extname]";
        }

        return "assets/js/[name]-[hash][extname]";
      },
    },
  },
},

    optimizeDeps: {
      include: [
        "react",
        "react-dom"
      ],
    },

    preview: {
      port: 4173,
    },
  };
});