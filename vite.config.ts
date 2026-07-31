import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const contentSecurityPolicy = "default-src 'self'; base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src https://*.supabase.co";

const productionSecurityMeta: Plugin = {
  name: "production-security-meta",
  apply: "build",
  transformIndexHtml(html) {
    const securityMeta = `    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}" />`;
    return html.replace(
      '    <meta name="referrer" content="strict-origin-when-cross-origin" />',
      `    <meta name="referrer" content="strict-origin-when-cross-origin" />\n${securityMeta}`,
    );
  },
};
// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), productionSecurityMeta],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}));
