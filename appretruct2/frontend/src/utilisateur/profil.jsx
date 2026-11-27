import React, { useEffect, useState } from "react";
import "../shared/galaxy.css";
import "../shared/profil.css";

const API_URL = "http://localhost:8000";

// Les appels API passent par le proxy Vite (/api) afin de conserver
// le cookie de session Django sur la même origine.
const API_BASE = "";

const CHAMPS_VIDES = {
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    date_naissance: "",
    ville: "",
    domaine: "",
    titre_professionnel: "",
    annees_experience: "",
    experience: "",
    competences: "",
    presentation: "",
    linkedin: "",
    portfolio: "",
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

export default function ProfilUtilisateur() {
    const [profil, setProfil] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    // Fenêtre de modification
    const [modification, setModification] = useState(false);
    const [form, setForm] = useState(CHAMPS_VIDES);
    const [motDePasseActuel, setMotDePasseActuel] = useState("");
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [fichierCv, setFichierCv] = useState(null);
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState("");
    const [erreurForm, setErreurForm] = useState("");

    useEffect(() => {
        let actif = true;

        async function chargerProfil() {
            try {
                const reponse = await fetch(
                    `${API_BASE}/api/utilisateur/profil/`,
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

    function ouvrirModification() {
        setForm({
            ...CHAMPS_VIDES,
            nom: profil.nom || "",
            prenom: profil.prenom || "",
            email: profil.email || "",
            telephone: profil.telephone || "",
            date_naissance: profil.date_naissance || "",
            ville: profil.ville || "",
            domaine: profil.domaine || "",
            titre_professionnel: profil.titre_professionnel || "",
            annees_experience:
                profil.annees_experience === 0
                    ? "0"
                    : String(profil.annees_experience || ""),
            experience: profil.experience || "",
            competences: profil.competences || "",
            presentation: profil.presentation || "",
            linkedin: profil.linkedin || "",
            portfolio: profil.portfolio || "",
        });
        setMotDePasseActuel("");
        setNouveauMotDePasse("");
        setConfirmation("");
        setFichierCv(null);
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

            if (fichierCv) {
                donnees.append("cv", fichierCv);
            }

            if (nouveauMotDePasse) {
                donnees.append("mot_de_passe_actuel", motDePasseActuel);
                donnees.append("nouveau_mot_de_passe", nouveauMotDePasse);
                donnees.append("confirmation", confirmation);
            }

            const reponse = await fetch(
                `${API_BASE}/api/utilisateur/profil/modifier/`,
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
            setMessage("Profil mis à jour avec succès.");
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
                    Chargement du profil...
                </div>
            </main>
        );
    }

    if (erreur) {
        return (
            <main className="pf-page">
                <div className="pf-state pf-state-erreur">
                    <h1>Profil utilisateur</h1>
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

    const urlCV = profil.cv
        ? profil.cv.startsWith("http")
            ? profil.cv
            : `${API_URL}${profil.cv}`
        : "";

    const nomComplet =
        [profil.prenom, profil.nom].filter(Boolean).join(" ") || "Candidat";

    const initiale = (profil.prenom || profil.nom || "C")
        .charAt(0)
        .toUpperCase();

    const annees = Number(profil.annees_experience) || 0;

    const lienLinkedIn = profil.linkedin
        ? /^https?:\/\//i.test(profil.linkedin)
            ? profil.linkedin
            : `https://${profil.linkedin}`
        : "";

    const lienPortfolio = profil.portfolio
        ? /^https?:\/\//i.test(profil.portfolio)
            ? profil.portfolio
            : `https://${profil.portfolio}`
        : "";

    return (
        <main className="pf-page">
            <div className="pf-wrap">
                <section className="pf-hero">
                    <div className="pf-cover" />

                    <div className="pf-hero-body">
                        <div className="pf-avatar">{initiale}</div>

                        <div className="pf-identity">
                            <span className="pf-badge">
                                <i className="fa-solid fa-user" />
                                Candidat
                            </span>

                            <h1>{nomComplet}</h1>

                            <p className="pf-subtitle">
                                {profil.titre_professionnel ||
                                    "Complète ton profil pour te présenter aux recruteurs."}
                            </p>

                            <div className="pf-chips">
                                <span className="pf-chip">
                                    <i className="fa-solid fa-location-dot" />
                                    {profil.ville || "Ville non renseignée"}
                                </span>

                                <span className="pf-chip">
                                    <i className="fa-solid fa-phone" />
                                    {profil.telephone ||
                                        "Téléphone non renseigné"}
                                </span>

                                <span className="pf-chip">
                                    <i className="fa-solid fa-briefcase" />
                                    {annees > 0
                                        ? `${annees} an${
                                              annees > 1 ? "s" : ""
                                          } d'expérience`
                                        : "Débutant"}
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
                                <i className="fa-solid fa-id-card" />
                            </span>

                            <div>
                                <h2>Identité</h2>
                                <small>Informations personnelles</small>
                            </div>
                        </header>

                        <dl className="pf-list">
                            <Ligne libelle="Nom" valeur={profil.nom} />
                            <Ligne libelle="Prénom" valeur={profil.prenom} />
                            <Ligne
                                libelle="Naissance"
                                valeur={profil.date_naissance}
                            />
                            <Ligne libelle="Ville" valeur={profil.ville} />
                        </dl>
                    </section>

                    <section className="pf-card">
                        <header className="pf-card-head">
                            <span className="pf-icon green">
                                <i className="fa-solid fa-address-book" />
                            </span>

                            <div>
                                <h2>Contact</h2>
                                <small>Coordonnées et liens</small>
                            </div>
                        </header>

                        <dl className="pf-list">
                            <Ligne libelle="E-mail" valeur={profil.email} />
                            <Ligne
                                libelle="Téléphone"
                                valeur={profil.telephone}
                            />
                            <LigneLien
                                libelle="LinkedIn"
                                url={lienLinkedIn}
                                texte="Voir le profil"
                            />
                            <LigneLien
                                libelle="Portfolio"
                                url={lienPortfolio}
                                texte="Voir le site"
                            />
                        </dl>
                    </section>

                    <section className="pf-card full">
                        <header className="pf-card-head">
                            <span className="pf-icon orange">
                                <i className="fa-solid fa-briefcase" />
                            </span>

                            <div>
                                <h2>Parcours professionnel</h2>
                                <small>
                                    Expérience, compétences et domaine
                                </small>
                            </div>
                        </header>

                        <dl className="pf-list">
                            <Ligne
                                libelle="Titre"
                                valeur={profil.titre_professionnel}
                            />
                            <Ligne libelle="Domaine" valeur={profil.domaine} />
                            <Ligne
                                libelle="Expérience"
                                valeur={
                                    annees > 0
                                        ? `${annees} an${
                                              annees > 1 ? "s" : ""
                                          }`
                                        : ""
                                }
                            />
                            <Ligne
                                libelle="Compétences"
                                valeur={profil.competences}
                            />
                            <Ligne
                                libelle="Parcours"
                                valeur={profil.experience}
                            />
                        </dl>
                    </section>

                    <section className="pf-card full">
                        <header className="pf-card-head">
                            <span className="pf-icon violet">
                                <i className="fa-solid fa-quote-left" />
                            </span>

                            <div>
                                <h2>Présentation</h2>
                                <small>Ce que les recruteurs voient</small>
                            </div>
                        </header>

                        <p
                            className={
                                profil.presentation
                                    ? "pf-text"
                                    : "pf-text pf-empty"
                            }
                        >
                            {profil.presentation ||
                                "Aucune présentation renseignée pour le moment."}
                        </p>
                    </section>

                    <section className="pf-card full">
                        <header className="pf-card-head">
                            <span className="pf-icon">
                                <i className="fa-solid fa-file-lines" />
                            </span>

                            <div>
                                <h2>Documents</h2>
                                <small>CV joint à ton dossier</small>
                            </div>
                        </header>

                        <div className="pf-doc">
                            <div className="pf-doc-info">
                                <span className="pf-icon orange">
                                    <i className="fa-solid fa-file-pdf" />
                                </span>

                                <div>
                                    <strong>Curriculum vitae</strong>
                                    <span>
                                        {urlCV
                                            ? "PDF ou document joint"
                                            : "Aucun fichier envoyé"}
                                    </span>
                                </div>
                            </div>

                            {urlCV ? (
                                <a
                                    className="pf-link-btn"
                                    href={urlCV}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <i className="fa-solid fa-download" />
                                    Consulter mon CV
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    className="pf-link-btn ghost"
                                    onClick={ouvrirModification}
                                >
                                    <i className="fa-solid fa-upload" />
                                    Ajouter un CV
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

                        <h2>Modifier mon profil</h2>
                        <p className="gx-modal-sub">
                            Mets à jour tes informations personnelles et
                            professionnelles.
                        </p>

                        {erreurForm && (
                            <p className="gx-msg gx-msg-erreur">
                                {erreurForm}
                            </p>
                        )}

                        <div className="gx-form-grid">
                            <div className="gx-field">
                                <label htmlFor="prenom">Prénom</label>
                                <input
                                    id="prenom"
                                    value={form.prenom}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            prenom: e.target.value,
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="nom">Nom</label>
                                <input
                                    id="nom"
                                    value={form.nom}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            nom: e.target.value,
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
                                <label htmlFor="date_naissance">
                                    Date de naissance
                                </label>
                                <input
                                    id="date_naissance"
                                    type="date"
                                    value={form.date_naissance}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            date_naissance: e.target.value,
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
                                <label htmlFor="titre">
                                    Titre professionnel
                                </label>
                                <input
                                    id="titre"
                                    value={form.titre_professionnel}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            titre_professionnel:
                                                e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="domaine">Domaine</label>
                                <input
                                    id="domaine"
                                    value={form.domaine}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            domaine: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="annees">
                                    Années d'expérience
                                </label>
                                <input
                                    id="annees"
                                    type="number"
                                    min="0"
                                    value={form.annees_experience}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            annees_experience: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="cv">CV (PDF, DOC)</label>
                                <input
                                    id="cv"
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) =>
                                        setFichierCv(
                                            e.target.files?.[0] || null
                                        )
                                    }
                                />
                                <small>
                                    Laisse vide pour conserver le CV actuel.
                                </small>
                            </div>

                            <div className="gx-field full">
                                <label htmlFor="competences">
                                    Compétences
                                </label>
                                <textarea
                                    id="competences"
                                    value={form.competences}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            competences: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field full">
                                <label htmlFor="experience">
                                    Expérience
                                </label>
                                <textarea
                                    id="experience"
                                    value={form.experience}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            experience: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field full">
                                <label htmlFor="presentation">
                                    Présentation
                                </label>
                                <textarea
                                    id="presentation"
                                    value={form.presentation}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            presentation: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="linkedin">LinkedIn</label>
                                <input
                                    id="linkedin"
                                    type="url"
                                    placeholder="https://linkedin.com/in/..."
                                    value={form.linkedin}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            linkedin: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="gx-field">
                                <label htmlFor="portfolio">Portfolio</label>
                                <input
                                    id="portfolio"
                                    type="url"
                                    placeholder="https://..."
                                    value={form.portfolio}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            portfolio: e.target.value,
                                        }))
                                    }
                                />
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
