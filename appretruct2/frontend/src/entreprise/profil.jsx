import React, { useEffect, useState } from "react";
import "./profil.css"
const API_URL = "http://localhost:8000";

export default function ProfilEntreprise() {
const [profil, setProfil] = useState(null);
const [chargement, setChargement] = useState(true);
const [erreur, setErreur] = useState("");


useEffect(() => {
    let actif = true;

    async function chargerProfil() {
        try {
            const reponse = await fetch(
                `${API_URL}/api/entreprise/profil/`,
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
                        "Tu n'es pas connecté. Connecte-toi avec ton compte entreprise."
                    );
                }

                if (reponse.status === 403) {
                    throw new Error(
                        "Ton compte n'est pas autorisé à consulter ce profil."
                    );
                }

                throw new Error(
                    donnees.erreur ||
                    donnees.message ||
                    "Impossible de charger le profil de l'entreprise."
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
        <main className="entreprise-profil-container">
            <p>Chargement du profil de l'entreprise...</p>
        </main>
    );
}

if (erreur) {
    return (
        <main className="entreprise-profil-container">
            <h1>Profil de l'entreprise</h1>

            <p className="entreprise-profil-erreur">
                {erreur}
            </p>

            <a href="/connexion/">
                Aller à la connexion
            </a>
        </main>
    );
}

if (!profil) {
    return (
        <main className="entreprise-profil-container">
            <p>Aucune information de profil disponible.</p>
        </main>
    );
}

const urlDocument = profil.document_presentation
    ? profil.document_presentation.startsWith("http")
        ? profil.document_presentation
        : `${API_URL}${profil.document_presentation}`
    : "";

const urlSite = profil.site_web
    ? /^https?:\/\//i.test(profil.site_web)
        ? profil.site_web
        : `https://${profil.site_web}`
    : "";

return (
    <main className="entreprise-profil-container">
        <header className="entreprise-profil-header">
            <div className="entreprise-profil-avatar">
                {(profil.nom_entreprise || "E")
                    .charAt(0)
                    .toUpperCase()}
            </div>

            <div>
                <h1>
                    {profil.nom_entreprise || "Entreprise"}
                </h1>

                <p>Espace entreprise · Profil</p>
            </div>
        </header>

        <section className="entreprise-profil-card">
            <h2>Informations de l'entreprise</h2>

            <div className="entreprise-profil-information">
                <span>Nom de l'entreprise</span>
                <p>
                    {profil.nom_entreprise || "Non renseigné"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Domaine d'activité</span>
                <p>
                    {profil.domaine_activite || "Non renseigné"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Secteur d'activité</span>
                <p>
                    {profil.secteur_activite || "Non renseigné"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Type d'entreprise</span>
                <p>
                    {profil.type_entreprise || "Non renseigné"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Téléphone</span>
                <p>
                    {profil.telephone || "Non renseigné"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>E-mail</span>
                <p>
                    {profil.email || "Non renseigné"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Ville</span>
                <p>
                    {profil.ville || "Non renseignée"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Adresse</span>
                <p>
                    {profil.adresse || "Non renseignée"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Site internet</span>

                {urlSite ? (
                    <a
                        href={urlSite}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {profil.site_web}
                    </a>
                ) : (
                    <p>Non renseigné</p>
                )}
            </div>

            <div className="entreprise-profil-information">
                <span>Description</span>
                <p>
                    {profil.description ||
                        "Aucune description disponible"}
                </p>
            </div>

            <div className="entreprise-profil-information">
                <span>Document de présentation</span>

                {urlDocument ? (
                    <a
                        href={urlDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Consulter le document
                    </a>
                ) : (
                    <p>Aucun document disponible</p>
                )}
            </div>
        </section>
    </main>
);


}
