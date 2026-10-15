import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

export default defineConfig(({ mode }) => {
  const isMobile = mode === "mobile";
  const enablePwa = mode !== "desktop" && mode !== "test";

  const pwaPlugin = enablePwa
    ? VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "logo.svg", "pwa-192.png", "pwa-512.png"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/openlibrary\.org\/(api\/|search\.json)/,
              handler: "NetworkFirst",
              options: {
                cacheName: "openlibrary-api",
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/covers\.openlibrary\.org\//,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "openlibrary-covers",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/www\.googleapis\.com\/books\//,
              handler: "NetworkFirst",
              options: {
                cacheName: "google-books-api",
                networkTimeoutSeconds: 10,
                expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          id: isMobile ? "./" : "/",
          name: "Shelfmark — Personal Bookshelf",
          short_name: "Shelfmark",
          description: "Your personal bookshelf, scanned from real life.",
          lang: "en",
          dir: "ltr",
          start_url: isMobile ? "./" : "/",
          scope: isMobile ? "./" : "/",
          display: "standalone",
          display_override: ["standalone", "browser"],
          orientation: "portrait-primary",
          background_color: "#1e1916",
          theme_color: "#1e1916",
          categories: ["books", "productivity"],
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      })
    : null;

  return {
    base: isMobile ? "./" : "/",
    plugins: [tailwindcss(), react(), ...(pwaPlugin ? [pwaPlugin] : [])],
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("@zxing")) return "zxing";
            // Split stable vendor code from app code so app updates re-download less.
            if (/node_modules[\/](react|react-dom|scheduler)[\/]/.test(id)) return "react";
            if (/node_modules[\/](radix-ui|@radix-ui)[\/]/.test(id)) return "radix";
          },
        },
      },
    },
  };
});
