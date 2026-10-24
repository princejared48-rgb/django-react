import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./connexion.css";

function Connexion() {
const [email, setEmail] = useState("");
const [motdepasse, setMotdepasse] = useState("");
const [message, setMessage] = useState("");


function gererConnexion(e) {
    e.preventDefault();

    setMessage("Le formulaire est prêt. La connexion à Django reste à configurer.");
}

return (
    <div className="connexion-page">

        <header className="connexion-header">
            <div className="connexion-navbar">
                <a href="/" className="connexion-logo">
                    APPRETRUCT
                </a>
            </div>
        </header>

        <div className="connexion-page1">

            <main className="connexion-dedans">

                <section className="connexion-welcome">
                    <h1>Bon retour !</h1>
                    <p>Connectez-vous à votre espace APPRETRUCT</p>
                </section>

                <section className="connexion-form-area">

                    <h2>Connexion</h2>

                    {message && (
                        <div className="connexion-message" role="alert">
                            {message}
                        </div>
                    )}

                    <form onSubmit={gererConnexion}>

                        <label htmlFor="email">
                            Adresse e-mail
                        </label>

                        <div className="connexion-input-box">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="exemple@email.com"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <label htmlFor="password">
                            Mot de passe
                        </label>

                        <div className="connexion-input-box">
                            <input
                                id="password"
                                name="motdepasse"
                                type="password"
                                placeholder="Mot de passe"
                                autoComplete="current-password"
                                value={motdepasse}
                                onChange={(e) => setMotdepasse(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            className="connexion-btn-submit"
                            type="submit"
                        >
                            SE CONNECTER
                        </button>

                    </form>

                </section>

            </main>

            <footer className="connexion-footer">
                © 2026 Copyright : Jared. Tous droits réservés.
            </footer>

        </div>

    </div>
);

}

createRoot(document.getElementById("connexion-root")).render( <Connexion />
);
