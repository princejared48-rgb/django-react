import React, { useEffect, useState } from "react";
import "../shared/galaxy.css";
import "../shared/profil.css";

// Les appels API passent par le proxy Vite (/api) afin de conserver
// le cookie de session Django sur la même origine.
const API_BASE = "";

async function obtenirJetonCsrf() {
    const reponse = await fetch(`${API_BASE}/api/csrf/`, {
        credentials: "same-origin",
    });

    const donnees = await reponse.json();

    return donnees.csrfToken || "";
}

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

export default function ProfilAdministrateur() {
    const [profil, setProfil] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");

    const [modification, setModification] = useState(false);
    const [form, setForm] = useState({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
    });
    const [motDePasseActuel, setMotDePasseActuel] = useState("");
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [envoi, setEnvoi] = useState(false);
    const [message, setMessage] = useState("");
    const [erreurForm, setErreurForm] = useState("");

    useEffect(() => {
        let actif = true;

        (async () => {
            try {
                const reponse = await fetch(
                    `${API_BASE}/api/administrateur/profil/`,
                    {
                        credentials: "same-origin",
                        headers: { Accept: "application/json" },
                    }
                );

                const donnees = await reponse.json();

                if (!reponse.ok) {
                    throw new Error(
                        donnees.message ||
                            "Impossible de charger le profil administrateur."
                    );
                }

                if (actif) {
                    setProfil(donnees);
                }
            } catch (error) {
                if (actif) {
                    setErreur(error.message);
                }
            } finally {
                if (actif) {
                    setChargement(false);
                }
            }
        })();

        return () => {
            actif = false;
        };
    }, []);

    function ouvrirModification() {
        setForm({
            nom: profil.nom || "",
            prenom: profil.prenom || "",
            email: profil.email || "",
            telephone: profil.telephone || "",
        });
        setMotDePasseActuel("");
        setNouveauMotDePasse("");
        setConfirmation("");
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
            const corps = { ...form };

            if (nouveauMotDePasse) {
                corps.mot_de_passe_actuel = motDePasseActuel;
                corps.nouveau_mot_de_passe = nouveauMotDePasse;
                corps.confirmation = confirmation;
            }

            const reponse = await fetch(
                `${API_BASE}/api/administrateur/profil/modifier/`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "X-CSRFToken": jeton,
                    },
                    body: JSON.stringify(corps),
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
                    <h1>Profil administrateur</h1>
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

    const nomComplet =
        [profil.prenom, profil.nom].filter(Boolean).join(" ") ||
        "Administrateur";

    const initiale = (profil.prenom || profil.nom || "A")
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
                            <span className="pf-badge violet">
                                <i className="fa-solid fa-user-shield" />
                                Administrateur
                            </span>

                            <h1>{nomComplet}</h1>

                            <p className="pf-subtitle">
                                Accès complet à la gestion des comptes de la
                                plateforme.
                            </p>

                            <div className="pf-chips">
                                <span className="pf-chip">
                                    <i className="fa-solid fa-envelope" />
                                    {profil.email ||
                                        "E-mail non renseigné"}
                                </span>

                                <span className="pf-chip">
                                    <i className="fa-solid fa-phone" />
                                    {profil.telephone ||
                                        "Téléphone non renseigné"}
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
                            <span className="pf-icon violet">
                                <i className="fa-solid fa-user-shield" />
                            </span>

                            <div>
                                <h2>Compte</h2>
                                <small>Identité et coordonnées</small>
                            </div>
                        </header>

                        <dl className="pf-list">
                            <Ligne libelle="Nom" valeur={profil.nom} />
                            <Ligne libelle="Prénom" valeur={profil.prenom} />
                            <Ligne libelle="E-mail" valeur={profil.email} />
                            <Ligne
                                libelle="Téléphone"
                                valeur={profil.telephone}
                            />
                            <Ligne libelle="Rôle" valeur="Administrateur" />
                        </dl>
                    </section>

                    <section className="pf-card">
                        <header className="pf-card-head">
                            <span className="pf-icon green">
                                <i className="fa-solid fa-lock" />
                            </span>

                            <div>
                                <h2>Sécurité</h2>
                                <small>Protection du compte</small>
                            </div>
                        </header>

                        <p className="pf-text">
                            Ton mot de passe protège l'accès à la gestion des
                            comptes. Modifie-le régulièrement.
                        </p>

                        <div className="pf-doc" style={{ marginTop: 16 }}>
                            <div className="pf-doc-info">
                                <span className="pf-icon">
                                    <i className="fa-solid fa-key" />
                                </span>

                                <div>
                                    <strong>Mot de passe</strong>
                                    <span>Minimum 8 caractères</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="pf-link-btn ghost"
                                onClick={ouvrirModification}
                            >
                                <i className="fa-solid fa-rotate" />
                                Changer
                            </button>
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
                            Mets à jour tes coordonnées d'administrateur.
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
