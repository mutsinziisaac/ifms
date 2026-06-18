import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env (incl. non-VITE_ vars) so the dev server can read the proxy target.
  const env = loadEnv(mode, process.cwd(), "")
  const proxyTarget = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // Dev-only reverse proxy. The browser calls a same-origin path
    // (set VITE_API_BASE_URL=/api/v1) and Vite forwards every /api request to
    // the real backend, so there are no cross-origin (CORS) calls in dev. Set
    // VITE_API_PROXY_TARGET to the backend ORIGIN, e.g.
    // https://ifms-backend.ayinza.dev. `changeOrigin` rewrites the Host header
    // so the backend's vhost/TLS matches. Not used by `npm run build`.
    server: proxyTarget
      ? {
          proxy: {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
              // `changeOrigin` rewrites Host but NOT Origin, so the browser's
              // same-origin Origin (http://localhost:5173) still rides along on
              // state-changing requests (POST/PUT/DELETE) and the backend's CORS
              // filter rejects it ("403 CORS Rejected - Invalid origin"). GETs
              // work only because browsers omit Origin on same-origin GETs.
              // Strip Origin on the proxied request so every method reads as a
              // server-to-server call and bypasses the filter.
              configure: (proxy) => {
                proxy.on("proxyReq", (proxyReq) => {
                  proxyReq.removeHeader("origin")
                })
              },
            },
          },
        }
      : undefined,
  }
})
