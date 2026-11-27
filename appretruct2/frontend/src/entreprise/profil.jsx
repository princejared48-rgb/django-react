import React, { useEffect, useState } from "react";
import "../shared/galaxy.css";
import "../shared/profil.css";

const API_URL = "http://localhost:8000";

// Les appels API passent par le proxy Vite (/api) afin de conserver
// le cookie de session Django sur la même origine.
const API_BASE = "";

const TYPES_ENTREPRISE = [
    ["privee", "Entreprise privée"],
    ["publique", "Entreprise publique"],
    ["startup", "Startup"],
    ["ong", "ONG ou association"],
    ["autre", "Autre"],
];

const CHAMPS_VIDES = {
    nom_entreprise: "",
    email: "",
    domaine_activite: "",
    secteur_activite: "",
    type_entreprise: "privee",
    site_web: "",
    telephone: "",
    ville: "",
    adresse: "",
    effectif: "",
    annee_creation: "",
    description: "",
};

async function obtenirJetonCsrf() {
    const reponse = await fetch(`${API_BASE}/api/csrf/`, {
        credentials: "same-origin",
    });

    const donnees = await reponse.json();

    return donnees.csrfToken || "";
}

/* Petits blocs d'affichage réutilisés dans les cartes du profil. */

function Ligne({ libelle, valeur }) {
    const vide = valeur === "" || valeur === null || valeur === undefined;

    return (
        <div className="pf-row">
            <dt>{libelle}</dt>
            <dd className={vide ? "pf-empty" : undefined}>
                {vide ? "Non renseigné" : valeur}
            </dd>
        </div>
    );
}

function LigneLien({ libelle, url, texte }) {
    return (
        <div className="pf-row">
            <dt>{libelle}</dt>
            <dd>
                {url ? (
                    <a
                        className="pf-row-link"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {texte || url}
                        <i className="fa-solid fa-arrow-up-right-from-square" />
                    </a>
                ) : (
                    <span className="pf-empty">Non renseigné</span>
                )}
            </dd>
        </div>
    );
}

export default function ProfilEntreprise() {
    const [profil, setProfil] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Fenêtre de modification
    const [modification, setModification] = useState(false);
    const [form, setForm] = useState(CHAMPS_VIDES);
    const [motDePasseActuel, setMotDePasseActuel] = useState("");
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [fichierDocument, setFichierDocument] = useState(null);
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState("");
    const [erreurForm, setErreurForm] = useState("");

    useEffect(() => {
        let actif = true;

        async function chargerProfil() {
            try {
                const reponse = await fetch(
                    `${API_BASE}/api/entreprise/profil/`,
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

    function ouvrirModification() {
        setForm({
            ...CHAMPS_VIDES,
            nom_entreprise: profil.nom_entreprise || "",
            email: profil.email || "",
            domaine_activite: profil.domaine_activite || "",
            secteur_activite: profil.secteur_activite || "",
            type_entreprise: profil.type_entreprise || "privee",
            site_web: profil.site_web || "",
            telephone: profil.telephone || "",
            ville: profil.ville || "",
            adresse: profil.adresse || "",
            effectif: profil.effectif || "",
            annee_creation: profil.annee_creation
                ? String(profil.annee_creation)
                : "",
            description: profil.description || "",
        });
        setMotDePasseActuel("");
        setNouveauMotDePasse("");
        setConfirmation("");
        setFichierDocument(null);
        setErreurForm("");
        setMessage("");
        setModification(true);
    }

    async function envoyerModification(evenement) {
        evenement.preventDefault();
        setEnvoi(true);
        setErreurForm("");
        setMessage("");

        try {
            const jeton = await obtenirJetonCsrf();
            const donnees = new FormData();

            Object.entries(form).forEach(([cle, valeur]) => {
                donnees.append(cle, valeur ?? "");
            });

            if (fichierDocument) {
                donnees.append("document_presentation", fichierDocument);
            }

            if (nouveauMotDePasse) {
                donnees.append("mot_de_passe_actuel", motDePasseActuel);
                donnees.append("nouveau_mot_de_passe", nouveauMotDePasse);
                donnees.append("confirmation", confirmation);
            }

            const reponse = await fetch(
                `${API_BASE}/api/entreprise/profil/modifier/`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        Accept: "application/json",
                        "X-CSRFToken": jeton,
                    },
                    body: donnees,
                }
            );

            const resultat = await reponse.json();

            if (!reponse.ok) {
                const details = Array.isArray(resultat.details)
                    ? ` ${resultat.details.join(" ")}`
                    : "";

                throw new Error(
                    `${resultat.message || "Modification impossible."}${details}`
                );
            }

            setProfil(resultat);
            setModification(false);
            setMessage("Profil de l'entreprise mis à jour avec succès.");
        } catch (error) {
            setErreurForm(
                error.message || "Impossible d'enregistrer les modifications."
            );
        } finally {
            setEnvoi(false);
        }
    }

    if (chargement) {
        return (
            <main className="pf-page">
                <div className="pf-state">
                    <span className="pf-spinner" />
                    Chargement du profil de l'entreprise...
                </div>
            </main>
        );
    }

    if (erreur) {
        return (
            <main className="pf-page">
                <div className="pf-state pf-state-erreur">
                    <h1>Profil de l'entreprise</h1>
                    <p>{erreur}</p>
                    <a
                        className="pf-link-btn"
                        href="/connexion/connexion.html"
                    >
                        <i className="fa-solid fa-right-to-bracket" />
                        Aller à la connexion
                    </a>
                </div>
            </main>
        );
    }

    if (!profil) {
        return (
            <main className="pf-page">
                <div className="pf-state">
                    Aucune information de profil disponible.
                </div>
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

    const libelleType =
        TYPES_ENTREPRISE.find(
            ([valeur]) => valeur === profil.type_entreprise
        )?.[1] || profil.type_entreprise;

    const nomEntreprise = profil.nom_entreprise || "Entreprise";

    const initiale = (profil.nom_entreprise || "E")
        .charAt(0)
        .toUpperCase();

    return (
        <main className="pf-page">
            <div className="pf-wrap">
                <section className="pf-hero">
                    <div className="pf-cover" />

                    <div className="pf-hero-body">
                        <div className="pf-avatar">{initiale}</div>

                        <div className="pf-identity">
                            <span className="pf-badge orange">
                                <i className="fa-solid fa-building" />
                                Entreprise
                            </span>

                            <h1>{nomEntreprise}</h1>

                            <p className="pf-subtitle">
                                {profil.domaine_activite ||
                                    "Complète le profil de ta structure pour gagner en visibilité."}
                            </p>

                            <div className="pf-chips">
                                <span className="pf-chip">
                                    <i className="fa-solid fa-location-dot" />
                                    {profil.ville || "Ville non renseignée"}
                                </span>

                                <span className="pf-chip">
                                    <i className="fa-solid fa-users" />
                                    {profil.effectif || "Effectif non renseigné"}
                                </span>

                                <span className="pf-chip">
                                    <i className="fa-solid fa-calendar" />
                                    {profil.annee_creation
                                        ? `Depuis ${profil.annee_creation}`
                                        : "Année non renseignée"}
                                </span>
                            </div>
                        </div>

                        <div className="pf-hero-actions">
                            <button
                                type="button"
                                className="pf-btn-edit"
                                onClick={ouvrirModification}
                            >
                                <i className="fa-solid fa-pen-to-square" />
                                Modifier
                            </button>
                        </div>
                    </div>
                </section>

                {message && (
                    <p className="gx-msg gx-msg-succes">{message}</p>
                )}

                <div className="pf-grid">
                    <section className="pf-card">
                        <header className="pf-card-head">
                            <span className="pf-icon">
                                <i className="fa-solid fa-building-columns" />
                            </span>

                            <div>
                                <h2>Identité</h2>
                                <small>Informations de la structure</small>
                            </div>
                        </header>

                        <dl className="pf-list">
                            <Ligne
                                libelle="Entreprise"
                                valeur={profil.nom_entreprise}
                            />
                            <Ligne libelle="Type" valeur={libelleType} />
                            <Ligne
                                libelle="Secteur"
                                valeur={profil.secteur_activite}
                            />
                            <Ligne
                                libelle="Domaine"
                                valeur={profil.domaine_activite}
                            />
                            <Ligne
                                libelle="Création"
                                valeur={profil.annee_creation}
                            />
                            <Ligne
                                libelle="Effectif"
                                valeur={profil.effectif}
                            />
                        </dl>
                    </section>

                    <section className="pf-card">
                        <header className="pf-card-head">
                            <span className="pf-icon green">
                                <i className="fa-solid fa-address-book" />
                            </span>

                            <div>
                                <h2>Coordonnées</h2>
                                <small>Comment vous joindre</small>
                            </div>
                        </header>

                        <dl className="pf-list">
                            <Ligne libelle="E-mail" valeur={profil.email} />
                            <Ligne
                                libelle="Téléphone"
                                valeur={profil.telephone}
                            />
                            <Ligne libelle="Ville" valeur={profil.ville} />
                            <Ligne libelle="Adresse" valeur={profil.adresse} />
                            <LigneLien
                                libelle="Site web"
                                url={urlSite}
                                texte={profil.site_web}
                            />
                        </dl>
                    </section>

                    <section className="pf-card full">
                        <header className="pf-card-head">
                            <span className="pf-icon violet">
                                <i className="fa-solid fa-align-left" />
                            </span>

                            <div>
                                <h2>Présentation</h2>
                                <small>Description visible par les candidats</small>
                            </div>
                        </header>

                        <p
                            className={
                                profil.description
                                    ? "pf-text"
                                    : "pf-text pf-empty"
                            }
                        >
                            {profil.description ||
                                "Aucune description renseignée pour le moment."}
                        </p>
                    </section>

                    <section className="pf-card full">
                        <header className="pf-card-head">
                            <span className="pf-icon orange">
                                <i className="fa-solid fa-file-lines" />
                            </span>

                            <div>
                                <h2>Document de présentation</h2>
                                <small>Plaquette ou dossier de l'entreprise</small>
                            </div>
                        </header>

                        <div className="pf-doc">
                            <div className="pf-doc-info">
                                <span className="pf-icon orange">
                                    <i className="fa-solid fa-file-pdf" />
                                </span>

                                <div>
                                    <strong>Document joint</strong>
                                    <span>
                                        {urlDocument
                                            ? "PDF ou document de présentation"
                                            : "Aucun fichier envoyé"}
                                    </span>
                                </div>
                            </div>

                            {urlDocument ? (
                                <a
                                    className="pf-link-btn"
                                    href={urlDocument}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-solid fa-download" />
                                    Consulter le document
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    className="pf-link-btn ghost"
                                    onClick={ouvrirModification}
                                >
                                    <i className="fa-solid fa-upload" />
                                    Ajouter un document
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {modification && (
                <div
                    className="gx-modal-bg"
                    onClick={() => setModification(false)}
                >
                    <form
                        className="gx-modal"
                        onSubmit={envoyerModification}
                        onClick={(evenement) => evenement.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="gx-modal-close"
                            onClick={() => setModification(false)}
                            aria-label="Fermer"
                        >
                            ×
                        </button>

                        <h2>Modifier le profil de l'entreprise</h2>
                        <p className="gx-modal-sub">
                            Mets à jour les informations de ta structure.
                        </p>

                        {erreurForm && (
                            <p className="gx-msg gx-msg-erreur">
                                {erreurForm}
                            </p>
                        )}

                        <div className="gx-form-grid">
                            <div className="gx-field">
                                <label htmlFor="nom_entreprise">
                                    Nom de l'entreprise
                                </label>
                                <input
                                    id="nom_entreprise"
                                    value={form.nom_entreprise}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            nom_entreprise: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="email">E-mail</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            email: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="domaine_activite">
                                    Domaine d'activité
                                </label>
                                <input
                                    id="domaine_activite"
                                    value={form.domaine_activite}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            domaine_activite: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="secteur_activite">
                                    Secteur d'activité
                                </label>
                                <input
                                    id="secteur_activite"
                                    value={form.secteur_activite}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            secteur_activite: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="type_entreprise">
                                    Type d'entreprise
                                </label>
                                <select
                                    id="type_entreprise"
                                    value={form.type_entreprise}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            type_entreprise: e.target.value,
                                        }))
                                    }
                                >
                                    {TYPES_ENTREPRISE.map(
                                        ([valeur, libelle]) => (
                                            <option
                                                key={valeur}
                                                value={valeur}
                                            >
                                                {libelle}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="gx-field">
                                <label htmlFor="telephone">Téléphone</label>
                                <input
                                    id="telephone"
                                    value={form.telephone}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            telephone: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="ville">Ville</label>
                                <input
                                    id="ville"
                                    value={form.ville}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            ville: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="adresse">Adresse</label>
                                <input
                                    id="adresse"
                                    value={form.adresse}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            adresse: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="effectif">Effectif</label>
                                <input
                                    id="effectif"
                                    placeholder="Ex : 10 à 50"
                                    value={form.effectif}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            effectif: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="annee_creation">
                                    Année de création
                                </label>
                                <input
                                    id="annee_creation"
                                    type="number"
                                    min="1800"
                                    max="2100"
                                    value={form.annee_creation}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            annee_creation: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field full">
                                <label htmlFor="site_web">Site internet</label>
                                <input
                                    id="site_web"
                                    placeholder="https://..."
                                    value={form.site_web}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            site_web: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field full">
                                <label htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field full">
                                <label htmlFor="document">
                                    Document de présentation (PDF, DOC)
                                </label>
                                <input
                                    id="document"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) =>
                                        setFichierDocument(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />
                                <small>
                                    Laisse vide pour conserver le document
                                    actuel.
                                </small>
                            </div>
                        </div>

                        <div className="gx-form-section">
                            <h3>
                                <i className="fa-solid fa-lock" />
                                Changer mon mot de passe
                            </h3>
                            <p>
                                Facultatif. Laisse vide pour conserver le mot
                                de passe actuel.
                            </p>

                            <div className="gx-form-grid">
                                <div className="gx-field full">
                                    <label htmlFor="mdp-actuel">
                                        Mot de passe actuel
                                    </label>
                                    <input
                                        id="mdp-actuel"
                                        type="password"
                                        autoComplete="current-password"
                                        value={motDePasseActuel}
                                        onChange={(e) =>
                                            setMotDePasseActuel(e.target.value)
                                        }
                                    />
                                </div>

                                <div className="gx-field">
                                    <label htmlFor="mdp-nouveau">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        id="mdp-nouveau"
                                        type="password"
                                        autoComplete="new-password"
                                        value={nouveauMotDePasse}
                                        onChange={(e) =>
                                            setNouveauMotDePasse(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="gx-field">
                                    <label htmlFor="mdp-confirmation">
                                        Confirmation
                                    </label>
                                    <input
                                        id="mdp-confirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmation}
                                        onChange={(e) =>
                                            setConfirmation(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="gx-form-actions">
                            <button
                                type="button"
                                className="gx-annuler"
                                onClick={() => setModification(false)}
                                disabled={envoi}
                            >
                                Annuler
                            </button>

                            <button
                                type="submit"
                                className="gx-enregistrer"
                                disabled={envoi}
                            >
                                <i className="fa-solid fa-floppy-disk" />
                                {envoi ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}
