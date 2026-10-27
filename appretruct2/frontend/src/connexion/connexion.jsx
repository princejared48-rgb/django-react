
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./connexion.css";

// ======================================================
// RÉCUPÉRER LE JETON CSRF
// ======================================================

function obtenirCookie(nom) {
    const cookies = `; ${document.cookie}`;
    const parties = cookies.split(`; ${nom}=`);

    if (parties.length === 2) {
        return decodeURIComponent(
            parties.pop().split(";").shift()
        );
    }

    return "";
}4


// ======================================================
// COMPOSANT CONNEXION
// ======================================================

function Connexion() {

    const [email, setEmail] = useState("");
    const [motdepasse, setMotdepasse] = useState("");
    const [message, setMessage] = useState("");
    const [chargement, setChargement] = useState(false);
    const [typeMessage, setTypeMessage] = useState("erreur");


    // ==================================================
    // GÉRER LA CONNEXION
    // ==================================================

    async function gererConnexion(e) {

        e.preventDefault();

        setMessage("");
        setChargement(true);

        try {

            // ------------------------------------------
            // 1. RÉCUPÉRER LE JETON CSRF DE DJANGO
            // ------------------------------------------

            const reponseCSRF = await fetch("/api/csrf/", {
                method: "GET",
                credentials: "same-origin",
            });

            if (!reponseCSRF.ok) {
                throw new Error(
                    "Impossible de contacter le serveur Django."
                );
            }

            // Vérifier que le cookie CSRF est disponible
            const jetonCSRF = obtenirCookie("csrftoken");

            if (!jetonCSRF) {
                throw new Error(
                    "Jeton de sécurité introuvable. Vérifie la configuration CSRF de Django."
                );
            }


            // ------------------------------------------
            // 2. ENVOYER LES IDENTIFIANTS À DJANGO
            // ------------------------------------------

            const reponse = await fetch("/api/connexion/", {
                method: "POST",

                credentials: "same-origin",

                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": jetonCSRF,
                    "Accept": "application/json",
                },

                body: JSON.stringify({
                    email: email.trim(),
                    motdepasse: motdepasse,
                }),
            });


            // ------------------------------------------
            // 3. LIRE LA RÉPONSE DE DJANGO
            // ------------------------------------------

            const typeContenu =
                reponse.headers.get("content-type") || "";

            const resultat = typeContenu.includes("application/json")
                ? await reponse.json()
                : {};

            if (!reponse.ok) {
                throw new Error(
                    resultat.message ||
                    `La connexion a échoué. Code : ${reponse.status}.`
                );
            }


            // ------------------------------------------
            // 4. IDENTIFIER LE TABLEAU DE BORD
            // ------------------------------------------

            const destinations = {
                utilisateur: "/utilisateur/tabbord.html",
                entreprise: "/entreprise/tabbord.html",
                administrateur: "/administrateur/tabbord.html",
            };

            const destination = destinations[resultat.role];

            if (!destination) {
                throw new Error(
                    "Le rôle de ce compte n'est pas reconnu."
                );
            }


            // ------------------------------------------
            // 5. AFFICHER LE MESSAGE DE SUCCÈS
            // ------------------------------------------

            setTypeMessage("succes");

            setMessage(
                resultat.message || "Connexion réussie !"
            );


            // ------------------------------------------
            // 6. REDIRIGER VERS LE TABLEAU DE BORD
            // ------------------------------------------

            window.location.assign(destination);

        } catch (erreur) {

            console.error(
                "Erreur de connexion :",
                erreur
            );

            setTypeMessage("erreur");

            setMessage(
                erreur.message ||
                "Une erreur est survenue pendant la connexion."
            );

        } finally {

            setChargement(false);

        }
    }


    // ==================================================
    // AFFICHAGE DE LA PAGE
    // ==================================================

    return (

        <div className="connexion-page">

            {/* EN-TÊTE */}

            <header className="connexion-header">

                <div className="connexion-navbar">

                    <a href="/" className="connexion-logo">
                        APPRETRUCT
                    </a>

                </div>

            </header>


            {/* CONTENU PRINCIPAL */}

            <div className="connexion-page1">

                <main className="connexion-dedans">

                    {/* MESSAGE DE BIENVENUE */}

                    <section className="connexion-welcome">

                        <h1>Bon retour !</h1>

                        <p>
                            Connectez-vous à votre espace APPRETRUCT
                        </p>

                    </section>


                    {/* FORMULAIRE DE CONNEXION */}

                    <section className="connexion-form-area">

                        <h2>Connexion</h2>


                        {/* MESSAGES D'ERREUR OU DE SUCCÈS */}

                        {message && (

                            <div
                                className={`connexion-message ${
                                    typeMessage === "succes"
                                        ? "connexion-succes"
                                        : "connexion-erreur"
                                }`}
                                role="alert"
                            >
                                {message}
                            </div>

                        )}


                        <form onSubmit={gererConnexion}>

                            {/* ADRESSE E-MAIL */}

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
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setMessage("");
                                    }}
                                    required
                                />

                            </div>


                            {/* MOT DE PASSE */}

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
                                    onChange={(e) => {
                                        setMotdepasse(e.target.value);
                                        setMessage("");
                                    }}
                                    required
                                />

                            </div>


                            {/* BOUTON DE CONNEXION */}

                            <button
                                className="connexion-btn-submit"
                                type="submit"
                                disabled={chargement}
                            >

                                {chargement ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        CONNEXION EN COURS...
                                    </>
                                ) : (
                                    "SE CONNECTER"
                                )}

                            </button>

                        </form>


                        {/* LIEN VERS L'INSCRIPTION */}

                        <p className="connexion-lien-inscription">
                            Vous n'avez pas encore de compte ?
                            {" "}
                            <a href="/inscription/inscription.html">
                                Inscrivez-vous
                            </a>
                        </p>

                    </section>

                </main>


                {/* PIED DE PAGE */}

                <footer className="connexion-footer">

                    © 2026 Copyright : Jared. Tous droits réservés.

                </footer>

            </div>

        </div>

    );
}


// ======================================================
// DÉMARRER REACT
// ======================================================

createRoot(
    document.getElementById("connexion-root")
).render(
    <Connexion />
);
