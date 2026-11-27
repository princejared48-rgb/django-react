import { useEffect, useMemo, useState } from "react";
import "./compteinscrit.css";

const groupes = [
    { role: "entreprise", label: "Entreprises", icon: "fa-building" },
    {
        role: "utilisateur",
        label: "Utilisateurs / Candidats",
        icon: "fa-user-tie",
    },
    {
        role: "administrateur",
        label: "Administrateurs",
        icon: "fa-user-shield",
    },
];

const champsParRole = {
    entreprise: [
        ["nom_entreprise", "Nom de l'entreprise", true],
        ["domaine_activite", "Domaine", true],
        ["telephone", "Téléphone", false],
        ["ville", "Ville", false],
        ["email", "Adresse e-mail", true],
    ],
    utilisateur: [
        ["prenom", "Prénom", true],
        ["nom", "Nom", true],
        ["telephone", "Téléphone", false],
        ["ville", "Ville", false],
        ["domaine", "Domaine", false],
        ["email", "Adresse e-mail", true],
    ],
    administrateur: [
        ["prenom", "Prénom", true],
        ["nom", "Nom", true],
        ["telephone", "Téléphone", false],
        ["email", "Adresse e-mail", true],
    ],
};

function roleLibelle(role) {
    return (
        groupes.find((groupe) => groupe.role === role)?.label || role
    );
}

export default function ComptesInscrits() {
    const [comptes, setComptes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [actualisation, setActualisation] = useState(0);
    const [recherche, setRecherche] = useState("");
    const [groupe, setGroupe] = useState("entreprise");
    const [edition, setEdition] = useState(null);
    const [form, setForm] = useState({});
    const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
    const [message, setMessage] = useState("");
    const [envoi, setEnvoi] = useState(false);

    useEffect(() => {
        const controleur = new AbortController();

        (async () => {
            setChargement(true);
            setErreur("");

            try {
                const reponse = await fetch(
                    "/api/administrateur/comptes/",
                    {
                        credentials: "same-origin",
                        headers: { Accept: "application/json" },
                        signal: controleur.signal,
                    }
                );

                const donnees = await reponse.json();

                if (!reponse.ok) {
                    throw new Error(
                        donnees.message ||
                            "Impossible de charger les comptes."
                    );
                }

                setComptes(donnees.comptes || []);
            } catch (error) {
                if (error.name !== "AbortError") {
                    setErreur(error.message);
                }
            } finally {
                if (!controleur.signal.aborted) {
                    setChargement(false);
                }
            }
        })();

        return () => controleur.abort();
    }, [actualisation]);

    const terme = recherche.trim().toLowerCase();

    // Sans recherche : on affiche la catégorie sélectionnée.
    // Avec recherche : on cherche dans TOUS les comptes, quel que soit l'onglet.
    const comptesAffiches = useMemo(() => {
        if (!terme) {
            return comptes.filter((compte) => compte.role === groupe);
        }

        return comptes.filter((compte) => {
            const contenu = [
                compte.nom_affichage,
                compte.email,
                compte.telephone,
                compte.ville,
                compte.domaine,
                compte.domaine_activite,
                compte.nom,
                compte.prenom,
                compte.nom_entreprise,
                roleLibelle(compte.role),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return contenu.includes(terme);
        });
    }, [comptes, groupe, terme]);

    async function jetonCsrf() {
        const reponse = await fetch("/api/csrf/", {
            credentials: "same-origin",
        });

        const donnees = await reponse.json();

        return donnees.csrfToken || "";
    }

    function ouvrirEdition(compte) {
        setMessage("");
        setEdition(compte);
        setNouveauMotDePasse("");
        setForm({
            email: compte.email || "",
            nom: compte.nom || "",
            prenom: compte.prenom || "",
            nom_entreprise: compte.nom_entreprise || "",
            domaine_activite:
                compte.domaine_activite || compte.domaine || "",
            telephone: compte.telephone || "",
            ville: compte.ville || "",
            domaine: compte.domaine || "",
        });
    }

    async function sauvegarder(evenement) {
        evenement.preventDefault();

        if (!edition) {
            return;
        }

        setEnvoi(true);
        setMessage("");

        try {
            const token = await jetonCsrf();
            const corps = { ...form };

            // Réinitialisation du mot de passe par l'administrateur.
            if (nouveauMotDePasse) {
                corps.nouveau_mot_de_passe = nouveauMotDePasse;
                corps.confirmation = nouveauMotDePasse;
            }

            const reponse = await fetch(
                `/api/administrateur/comptes/${edition.id}/`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": token,
                    },
                    body: JSON.stringify(corps),
                }
            );

            const donnees = await reponse.json();

            if (!reponse.ok) {
                const details = Array.isArray(donnees.details)
                    ? ` ${donnees.details.join(" ")}`
                    : "";

                throw new Error(
                    `${donnees.message || "Modification impossible."}${details}`
                );
            }

            setEdition(null);
            setNouveauMotDePasse("");
            setActualisation((valeur) => valeur + 1);
            setMessage(
                nouveauMotDePasse
                    ? "Compte et mot de passe modifiés avec succès."
                    : "Le compte a été modifié avec succès."
            );
        } catch (error) {
            setMessage(error.message);
        } finally {
            setEnvoi(false);
        }
    }

    async function supprimer(compte) {
        const confirme = window.confirm(
            `Confirmer la suppression du compte ${
                compte.nom_affichage || compte.email
            } ? Cette action est définitive.`
        );

        if (!confirme) {
            return;
        }

        setMessage("");

        try {
            const token = await jetonCsrf();
            const reponse = await fetch(
                `/api/administrateur/comptes/${compte.id}/`,
                {
                    method: "DELETE",
                    credentials: "same-origin",
                    headers: { "X-CSRFToken": token },
                }
            );

            const donnees = await reponse.json();

            if (!reponse.ok) {
                throw new Error(
                    donnees.message || "Suppression impossible."
                );
            }

            setComptes((precedents) =>
                precedents.filter((element) => element.id !== compte.id)
            );
            setMessage("Compte supprimé avec succès.");
        } catch (error) {
            setMessage(error.message);
        }
    }

    const groupeActif = groupes.find((element) => element.role === groupe);
    const libelleRecherche = terme
        ? "tous les comptes"
        : `${groupeActif.label.toLowerCase()}`;

    return (
        <section className="comptes-inscrits galaxy-accounts">
            <div className="comptes-entete">
                <div>
                    <span className="admin-kicker">CENTRE DE CONTRÔLE</span>
                    <h2 className="comptes-titre">
                        <i className="fas fa-users" /> Gestion des comptes
                    </h2>
                    <p className="comptes-description">
                        Sélectionne une catégorie ou utilise la recherche pour
                        trouver un compte par nom, e-mail, téléphone ou ville.
                    </p>
                </div>

                <div className="comptes-actions">
                    <a
                        className="admin-inscription"
                        href="/inscription/inscription.html"
                    >
                        <i className="fas fa-user-plus" /> Inscrire un compte
                    </a>

                    <div className="comptes-total">
                        Total : {comptes.length}
                    </div>

                    <button
                        type="button"
                        className="bouton-actualiser"
                        onClick={() => setActualisation((v) => v + 1)}
                        disabled={chargement}
                    >
                        <i className="fas fa-sync-alt" /> Actualiser
                    </button>
                </div>
            </div>

            <div className="admin-group-tabs">
                {groupes.map((element) => (
                    <button
                        key={element.role}
                        type="button"
                        className={
                            !terme && groupe === element.role ? "active" : ""
                        }
                        onClick={() => {
                            setGroupe(element.role);
                            setRecherche("");
                        }}
                    >
                        <i className={`fas ${element.icon}`} />
                        <span>{element.label}</span>
                        <b>
                            {
                                comptes.filter(
                                    (compte) => compte.role === element.role
                                ).length
                            }
                        </b>
                    </button>
                ))}
            </div>

            <div className="admin-search">
                <i className="fas fa-search" />

                <input
                    type="search"
                    value={recherche}
                    onChange={(evenement) =>
                        setRecherche(evenement.target.value)
                    }
                    placeholder={`Rechercher dans ${libelleRecherche}...`}
                    aria-label="Rechercher un compte"
                />

                {recherche && (
                    <button
                        type="button"
                        className="admin-search-effacer"
                        onClick={() => setRecherche("")}
                        aria-label="Effacer la recherche"
                    >
                        ×
                    </button>
                )}
            </div>

            {message && (
                <div className="admin-alert">
                    {message}
                    <button type="button" onClick={() => setMessage("")}>
                        ×
                    </button>
                </div>
            )}

            {chargement && (
                <div className="etat-message etat-chargement">
                    <i className="fas fa-spinner fa-spin" /> Chargement des
                    comptes...
                </div>
            )}

            {!chargement && erreur && (
                <div className="etat-message etat-erreur">{erreur}</div>
            )}

            {!chargement && !erreur && (
                <section className="admin-role-section">
                    <div className="admin-role-heading">
                        <span
                            className={`admin-role-icon ${
                                terme ? "recherche" : groupe
                            }`}
                        >
                            <i
                                className={`fas ${
                                    terme
                                        ? "fa-magnifying-glass"
                                        : groupeActif.icon
                                }`}
                            />
                        </span>

                        <div>
                            <h3>
                                {terme
                                    ? `Résultats pour « ${recherche.trim()} »`
                                    : groupeActif.label}
                            </h3>
                            <small>
                                {comptesAffiches.length} compte(s) affiché(s)
                            </small>
                        </div>
                    </div>

                    {!comptesAffiches.length ? (
                        <div className="admin-empty">
                            {terme
                                ? "Aucun compte ne correspond à cette recherche."
                                : "Aucun compte dans cette catégorie."}
                        </div>
                    ) : (
                        <div className="tableau-conteneur">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nom / structure</th>
                                        <th>E-mail</th>
                                        <th>Téléphone</th>
                                        <th>Ville</th>
                                        <th>Domaine</th>
                                        {terme && <th>Catégorie</th>}
                                        <th>Inscription</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {comptesAffiches.map((compte) => (
                                        <tr key={compte.id}>
                                            <td className="nom-compte">
                                                {compte.nom_affichage ||
                                                    "Non renseigné"}
                                                <small className="account-id">
                                                    Compte #{compte.id}
                                                </small>
                                            </td>
                                            <td className="email-compte">
                                                {compte.email || "—"}
                                            </td>
                                            <td>{compte.telephone || "—"}</td>
                                            <td>{compte.ville || "—"}</td>
                                            <td>{compte.domaine || "—"}</td>
                                            {terme && (
                                                <td>
                                                    <span
                                                        className={`role-badge ${compte.role}`}
                                                    >
                                                        {roleLibelle(
                                                            compte.role
                                                        )}
                                                    </span>
                                                </td>
                                            )}
                                            <td>
                                                {compte.date_inscription
                                                    ? new Date(
                                                          compte.date_inscription
                                                      ).toLocaleDateString(
                                                          "fr-FR"
                                                      )
                                                    : "—"}
                                            </td>
                                            <td>
                                                <div className="account-actions">
                                                    <button
                                                        type="button"
                                                        className="account-edit"
                                                        onClick={() =>
                                                            ouvrirEdition(
                                                                compte
                                                            )
                                                        }
                                                    >
                                                        <i className="fas fa-pen" />{" "}
                                                        Modifier
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="account-delete"
                                                        onClick={() =>
                                                            supprimer(compte)
                                                        }
                                                    >
                                                        <i className="fas fa-trash" />{" "}
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            )}

            <p className="comptes-pied">
                <i className="fas fa-shield-alt" /> Les modifications et
                suppressions sont traitées par Django et réservées aux
                administrateurs connectés.
            </p>

            {edition && (
                <div
                    className="account-modal-bg"
                    onClick={() => setEdition(null)}
                >
                    <form
                        className="account-modal"
                        onSubmit={sauvegarder}
                        onClick={(evenement) => evenement.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="modal-x"
                            onClick={() => setEdition(null)}
                            aria-label="Fermer"
                        >
                            ×
                        </button>

                        <span className="admin-kicker">
                            MODIFICATION DU COMPTE
                        </span>
                        <h3>{edition.nom_affichage || edition.email}</h3>

                        <div className="edit-fields">
                            {champsParRole[edition.role].map(
                                ([name, label, requis]) => (
                                    <label key={name}>
                                        {label}
                                        <input
                                            value={form[name] ?? ""}
                                            onChange={(evenement) =>
                                                setForm((precedent) => ({
                                                    ...precedent,
                                                    [name]:
                                                        evenement.target
                                                            .value,
                                                }))
                                            }
                                            required={requis}
                                        />
                                    </label>
                                )
                            )}
                        </div>

                        <div className="edit-fields edit-fields-mdp">
                            <label>
                                Nouveau mot de passe (facultatif)
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    value={nouveauMotDePasse}
                                    onChange={(evenement) =>
                                        setNouveauMotDePasse(
                                            evenement.target.value
                                        )
                                    }
                                    placeholder="Laisser vide pour ne pas changer"
                                    minLength={8}
                                />
                            </label>
                        </div>

                        <div className="modal-note">
                            Le type de compte ne peut pas être changé ici afin
                            de protéger les droits d'accès. Le nouveau mot de
                            passe doit contenir au moins 8 caractères.
                        </div>

                        <button
                            className="modal-close"
                            disabled={envoi}
                        >
                            {envoi
                                ? "Enregistrement..."
                                : "Enregistrer les modifications"}
                        </button>
                    </form>
                </div>
            )}
        </section>
    );
}
