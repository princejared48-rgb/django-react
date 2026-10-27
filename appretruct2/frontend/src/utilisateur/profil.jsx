import React, { useEffect, useState } from "react";
import"./profil.css";
const API_URL = "http://localhost:8000";

export default function ProfilUtilisateur() {
const [profil, setProfil] = useState(null);
const [chargement, setChargement] = useState(true);
const [erreur, setErreur] = useState("");

useEffect(() => {
    let actif = true;

    async function chargerProfil() {
        try {
            const reponse = await fetch(
                `${API_URL}/api/utilisateur/profil/`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const donnees = await reponse.json();

            if (!reponse.ok) {
                if (reponse.status === 401) {
                    throw new Error(
                        "Tu n'es pas connecté. Connecte-toi puis ouvre ton profil."
                    );
                }

                if (reponse.status === 403) {
                    throw new Error(
                        "Ce compte n'est pas autorisé à consulter le profil utilisateur."
                    );
                }

                throw new Error(
                    donnees.message ||
                    "Impossible de charger le profil."
                );
            }

            if (actif) {
                setProfil(donnees);
                setErreur("");
            }
        } catch (error) {
            if (actif) {
                setErreur(
                    error.message ||
                    "Impossible de communiquer avec le serveur Django."
                );
            }
        } finally {
            if (actif) {
                setChargement(false);
            }
        }
    }

    chargerProfil();

    return () => {
        actif = false;
    };
}, []);

if (chargement) {
    return (
        <main className="profil-container">
            <p>Chargement du profil...</p>
        </main>
    );
}

if (erreur) {
    return (
        <main className="profil-container">
            <h1>Profil utilisateur</h1>

            <p className="profil-erreur">{erreur}</p>

            <a href="/connexion/">
                Aller à la connexion
            </a>
        </main>
    );
}

if (!profil) {
    return (
        <main className="profil-container">
            <p>Aucune information de profil disponible.</p>
        </main>
    );
}

const urlCV = profil.cv
    ? profil.cv.startsWith("http")
        ? profil.cv
        : `${API_URL}${profil.cv}`
    : "";

return (
    <main className="profil-container">
        <header className="profil-header">
            <div className="profil-avatar">
                {profil.prenom?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div>
                <h1>
                    {profil.prenom || ""} {profil.nom || ""}
                </h1>

                <p>Profil utilisateur</p>
            </div>
        </header>

        <section className="profil-card">
            <h2>Mes informations</h2>

            <div className="profil-information">
                <span>Nom</span>
                <p>{profil.nom || "Non renseigné"}</p>
            </div>

            <div className="profil-information">
                <span>Prénom</span>
                <p>{profil.prenom || "Non renseigné"}</p>
            </div>

            <div className="profil-information">
                <span>E-mail</span>
                <p>{profil.email || "Non renseigné"}</p>
            </div>

            <div className="profil-information">
                <span>Téléphone</span>
                <p>{profil.telephone || "Non renseigné"}</p>
            </div>

            <div className="profil-information">
                <span>Date de naissance</span>
                <p>{profil.date_naissance || "Non renseignée"}</p>
            </div>

            <div className="profil-information">
                <span>Ville</span>
                <p>{profil.ville || "Non renseignée"}</p>
            </div>

            <div className="profil-information">
                <span>CV</span>

                {urlCV ? (
                    <a
                        href={urlCV}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Consulter mon CV
                    </a>
                ) : (
                    <p>Aucun CV disponible</p>
                )}
            </div>
        </section>
    </main>
);


}
