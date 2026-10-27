
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
        // Ouvrir automatiquement la page d'accueil
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
                // Page d'accueil
                accueil: resolve(
                    dossierFrontend,
                    "acceuiltotal/acceuiltotal.html"
                ),

                // Page d'inscription
                inscription: resolve(
                    dossierFrontend,
                    "inscription/inscription.html"
                ),

                // Page de connexion
                connexion: resolve(
                    dossierFrontend,
                    "connexion/connexion.html"
                ),

                // Tableau de bord utilisateur
                utilisateur: resolve(
                    dossierFrontend,
                    "utilisateur/tabbord.html"
                ),

                // Tableau de bord entreprise
                entreprise: resolve(
                    dossierFrontend,
                    "entreprise/tabbord.html"
                ),

                // Tableau de bord administrateur
                administrateur: resolve(
                    dossierFrontend,
                    "administrateur/tabbord.html"
                ),

                // Page du footer
                footer: resolve(
                    dossierFrontend,
                    "footer.html"
                ),
            },
        },
    },
});
