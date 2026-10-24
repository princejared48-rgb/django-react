
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Chemin du dossier frontend
const dossierFrontend = fileURLToPath(
    new URL(".", import.meta.url)
);

export default defineConfig({
    plugins: [react()],

    // Application comportant plusieurs pages HTML
    appType: "mpa",

    // Configuration du serveur de développement
    server: {
        open: "/acceuiltotal/acceuiltotal.html",

        // Communication entre React et Django
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8000",
                changeOrigin: true,
            },
        },
    },

    // Pages à inclure dans la version de production
    build: {
        rollupOptions: {
            input: {
                accueil: resolve(
                    dossierFrontend,
                    "acceuiltotal/acceuiltotal.html"
                ),

                inscription: resolve(
                    dossierFrontend,
                    "inscription/inscription.html"
                ),

                utilisateur: resolve(
                    dossierFrontend,
                    "utilisateur/tabbord.html"
                ),

                entreprise: resolve(
                    dossierFrontend,
                    "entreprise/tabbord.html"
                ),

                administrateur: resolve(
                    dossierFrontend,
                    "administrateur/tabbord.html"
                ),
            },
        },
    },
});
