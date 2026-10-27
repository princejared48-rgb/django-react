
import { useState } from "react";
import "./inscription.css";

// ======================================================
// RÉCUPÉRER LE COOKIE CSRF DE DJANGO
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
}

// ======================================================
// COMPOSANT D'INSCRIPTION
// ======================================================

export default function Inscription() {
    const [role, setRole] = useState("utilisateur");

    const [formulaire, setFormulaire] = useState({
        nom: "",
        nom_entreprise: "",
        domaine: "",
        site_web: "",
        telephone: "",
        email: "",
        motdepasse: "",
        confirmation: "",
        ville: "",
        experience: "",
        competences: "",
        description: "",
        type_entreprise: "privee",
        code_autorisation: "",
    });

    const [cv, setCv] = useState(null);
    const [documentEntreprise, setDocumentEntreprise] =
        useState(null);

    const [erreur, setErreur] = useState("");
    const [message, setMessage] = useState("");
    const [chargement, setChargement] = useState(false);

    // ==================================================
    // MODIFIER LES CHAMPS
    // ==================================================

    function modifierChamp(event) {
        const { name, value } = event.target;

        setFormulaire((ancienFormulaire) => ({
            ...ancienFormulaire,
            [name]: value,
        }));

        setErreur("");
        setMessage("");
    }

    // ==================================================
    // CHANGER LE TYPE DE COMPTE
    // ==================================================

    function changerRole(nouveauRole) {
        setRole(nouveauRole);
        setErreur("");
        setMessage("");
    }

    // ==================================================
    // ENVOYER LE FORMULAIRE À DJANGO
    // ==================================================

    async function envoyerFormulaire(event) {
        event.preventDefault();

        setErreur("");
        setMessage("");

        if (formulaire.motdepasse !== formulaire.confirmation) {
            setErreur(
                "Les deux mots de passe ne correspondent pas."
            );
            return;
        }

        if (
            role === "utilisateur" &&
            formulaire.nom.trim().split(/\s+/).length < 2
        ) {
            setErreur(
                "Saisis ton prénom et ton nom dans le champ Nom complet."
            );
            return;
        }

        if (
            role === "entreprise" &&
            (
                !formulaire.nom_entreprise.trim() ||
                !formulaire.domaine.trim()
            )
        ) {
            setErreur(
                "Le nom de l'entreprise et le domaine d'activité sont obligatoires."
            );
            return;
        }

        if (
            role === "administrateur" &&
            (
                !formulaire.nom.trim() ||
                !formulaire.code_autorisation.trim()
            )
        ) {
            setErreur(
                "Le nom complet et le code d'autorisation sont obligatoires."
            );
            return;
        }

        setChargement(true);

        try {
            // 1. Obtenir le jeton CSRF

            const reponseCSRF = await fetch("/api/csrf/", {
                method: "GET",
                credentials: "same-origin",
            });

            if (!reponseCSRF.ok) {
                throw new Error(
                    "Impossible de préparer la communication avec Django."
                );
            }

            const jetonCSRF = obtenirCookie("csrftoken");

            if (!jetonCSRF) {
                throw new Error(
                    "Le jeton CSRF est absent. Vérifie la configuration de Django."
                );
            }

            // 2. Préparer les données

            const donnees = new FormData();

            donnees.append("role", role);
            donnees.append("email", formulaire.email.trim());
            donnees.append("motdepasse", formulaire.motdepasse);
            donnees.append("confirmation", formulaire.confirmation);

            // 3. Informations du candidat

            if (role === "utilisateur") {
                donnees.append("nom", formulaire.nom.trim());
                donnees.append("telephone", formulaire.telephone.trim());
                donnees.append("ville", formulaire.ville.trim());
                donnees.append("domaine", formulaire.domaine.trim());
                donnees.append("experience", formulaire.experience.trim());
                donnees.append("competences", formulaire.competences.trim());

                if (cv) {
                    donnees.append("cv", cv);
                }
            }

            // 4. Informations de l'entreprise

            if (role === "entreprise") {
                donnees.append(
                    "nom_entreprise",
                    formulaire.nom_entreprise.trim()
                );

                donnees.append("domaine", formulaire.domaine.trim());
                donnees.append("site_web", formulaire.site_web.trim());
                donnees.append("telephone", formulaire.telephone.trim());
                donnees.append("ville", formulaire.ville.trim());
                donnees.append("description", formulaire.description.trim());

                donnees.append(
                    "type_entreprise",
                    formulaire.type_entreprise
                );

                if (documentEntreprise) {
                    donnees.append(
                        "document_presentation",
                        documentEntreprise
                    );
                }
            }

            // 5. Informations de l'administrateur

            if (role === "administrateur") {
                donnees.append("nom", formulaire.nom.trim());
                donnees.append(
                    "code_autorisation",
                    formulaire.code_autorisation.trim()
                );
            }

            // 6. Envoyer les données à Django

            const reponse = await fetch("/api/inscription/", {
                method: "POST",
                headers: {
                    "X-CSRFToken": jetonCSRF,
                },
                credentials: "same-origin",
                body: donnees,
            });

            const resultat = await reponse.json();

            if (!reponse.ok) {
                let texteErreur =
                    resultat.message ||
                    "Une erreur est survenue pendant l'inscription.";

                if (Array.isArray(resultat.details)) {
                    texteErreur += " " + resultat.details.join(" ");
                } else if (
                    resultat.details &&
                    typeof resultat.details === "object"
                ) {
                    texteErreur += " " +
                        Object.values(resultat.details).flat().join(" ");
                }

                throw new Error(texteErreur);
            }

            // 7. Confirmer la création du compte

            setMessage(
                resultat.message ||
                "Le compte a été créé avec succès."
            );

            // Réinitialiser les champs

            setFormulaire({
                nom: "",
                nom_entreprise: "",
                domaine: "",
                site_web: "",
                telephone: "",
                email: "",
                motdepasse: "",
                confirmation: "",
                ville: "",
                experience: "",
                competences: "",
                description: "",
                type_entreprise: "privee",
                code_autorisation: "",
            });

            setCv(null);
            setDocumentEntreprise(null);

            event.target.reset();

        } catch (error) {
            console.error(
                "Erreur pendant l'inscription :",
                error
            );

            setErreur(
                error.message ||
                "Impossible de contacter le serveur Django."
            );

        } finally {
            setChargement(false);
        }
    }

    // ==================================================
    // AFFICHAGE
    // ==================================================

    return (
        <div className="inscription-page">

            <nav className="inscription-navbar">
                <a href="/" className="inscription-logo">
                    <i className="fas fa-briefcase"></i>
                    Appretruct
                </a>

                <a href="/" className="inscription-back">
                    <i className="fas fa-arrow-left"></i>
                    Accueil
                </a>
            </nav>

            <div className="inscription-container">
                <div className="inscription-card">

                    <div className="inscription-header">
                        <h1>Créer un compte</h1>

                        <p>
                            Rejoins Appretruct et accède aux
                            opportunités professionnelles.
                        </p>
                    </div>

                    <div className="inscription-body">

                        <form
                            className="inscription-form"
                            onSubmit={envoyerFormulaire}
                        >

                            {/* Messages */}

                            {erreur && (
                                <div
                                    className="inscription-error"
                                    role="alert"
                                >
                                    <i className="fas fa-exclamation-circle"></i>
                                    {erreur}
                                </div>
                            )}

                            {message && (
                                <div
                                    className="inscription-message"
                                    role="status"
                                >
                                    <i className="fas fa-check-circle"></i>
                                    {message}
                                </div>
                            )}

                            {/* Choix du compte */}

                            <h2 className="inscription-section-title">
                                <i className="fas fa-user-tag"></i>
                                Type de compte
                            </h2>

                            <div className="inscription-roles">

                                <label
                                    className={
                                        "inscription-role-card " +
                                        (role === "utilisateur" ? "active" : "")
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="utilisateur"
                                        checked={role === "utilisateur"}
                                        onChange={() =>
                                            changerRole("utilisateur")
                                        }
                                    />

                                    <i className="fas fa-user"></i>
                                    <h3>Candidat</h3>

                                    <p>
                                        Crée ton profil professionnel.
                                    </p>
                                </label>

                                <label
                                    className={
                                        "inscription-role-card " +
                                        (role === "entreprise" ? "active" : "")
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="entreprise"
                                        checked={role === "entreprise"}
                                        onChange={() =>
                                            changerRole("entreprise")
                                        }
                                    />

                                    <i className="fas fa-building"></i>
                                    <h3>Entreprise</h3>

                                    <p>
                                        Présente ton entreprise.
                                    </p>
                                </label>

                                <label
                                    className={
                                        "inscription-role-card " +
                                        (role === "administrateur" ? "active" : "")
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="administrateur"
                                        checked={role === "administrateur"}
                                        onChange={() =>
                                            changerRole("administrateur")
                                        }
                                    />

                                    <i className="fas fa-user-shield"></i>
                                    <h3>Administrateur</h3>

                                    <p>
                                        Accède à la gestion de la plateforme.
                                    </p>
                                </label>

                            </div>

                            {/* Informations du candidat */}

                            {role === "utilisateur" && (
                                <>
                                    <h2 className="inscription-section-title">
                                        <i className="fas fa-id-card"></i>
                                        Informations personnelles
                                    </h2>

                                    <div className="inscription-grid">

                                        <div className="inscription-field full-width">
                                            <label htmlFor="nom">
                                                Nom complet *
                                            </label>

                                            <input
                                                id="nom"
                                                name="nom"
                                                type="text"
                                                value={formulaire.nom}
                                                onChange={modifierChamp}
                                                placeholder="Prénom et nom"
                                                autoComplete="name"
                                                required
                                            />
                                        </div>

                                        <div className="inscription-field">
                                            <label htmlFor="telephone">
                                                Téléphone
                                            </label>

                                            <input
                                                id="telephone"
                                                name="telephone"
                                                type="tel"
                                                value={formulaire.telephone}
                                                onChange={modifierChamp}
                                                placeholder="Ton numéro de téléphone"
                                                autoComplete="tel"
                                            />
                                        </div>

                                        <div className="inscription-field">
                                            <label htmlFor="ville">
                                                Ville
                                            </label>

                                            <input
                                                id="ville"
                                                name="ville"
                                                type="text"
                                                value={formulaire.ville}
                                                onChange={modifierChamp}
                                                placeholder="Ex. Douala"
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="domaine">
                                                Domaine professionnel
                                            </label>

                                            <input
                                                id="domaine"
                                                name="domaine"
                                                type="text"
                                                value={formulaire.domaine}
                                                onChange={modifierChamp}
                                                placeholder="Ex. Informatique, commerce, santé..."
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="experience">
                                                Expérience professionnelle
                                            </label>

                                            <textarea
                                                id="experience"
                                                name="experience"
                                                rows="3"
                                                value={formulaire.experience}
                                                onChange={modifierChamp}
                                                placeholder="Présente brièvement tes expériences."
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="competences">
                                                Compétences
                                            </label>

                                            <textarea
                                                id="competences"
                                                name="competences"
                                                rows="3"
                                                value={formulaire.competences}
                                                onChange={modifierChamp}
                                                placeholder="Indique tes principales compétences."
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="cv">
                                                CV (facultatif)
                                            </label>

                                            <input
                                                id="cv"
                                                name="cv"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(event) =>
                                                    setCv(
                                                        event.target.files[0] || null
                                                    )
                                                }
                                            />

                                            <small>
                                                PDF, DOC ou DOCX. Taille maximale :
                                                10 Mo.
                                            </small>
                                        </div>

                                    </div>
                                </>
                            )}

                            {/* Informations de l'entreprise */}

                            {role === "entreprise" && (
                                <>
                                    <h2 className="inscription-section-title">
                                        <i className="fas fa-building"></i>
                                        Informations de l'entreprise
                                    </h2>

                                    <div className="inscription-grid">

                                        <div className="inscription-field full-width">
                                            <label htmlFor="nom_entreprise">
                                                Nom de l'entreprise *
                                            </label>

                                            <input
                                                id="nom_entreprise"
                                                name="nom_entreprise"
                                                type="text"
                                                value={formulaire.nom_entreprise}
                                                onChange={modifierChamp}
                                                placeholder="Nom de votre entreprise"
                                                required
                                            />
                                        </div>

                                        <div className="inscription-field">
                                            <label htmlFor="domaine">
                                                Domaine d'activité *
                                            </label>

                                            <input
                                                id="domaine"
                                                name="domaine"
                                                type="text"
                                                value={formulaire.domaine}
                                                onChange={modifierChamp}
                                                placeholder="Ex. Informatique"
                                                required
                                            />
                                        </div>

                                        <div className="inscription-field">
                                            <label htmlFor="type_entreprise">
                                                Type d'entreprise
                                            </label>

                                            <select
                                                id="type_entreprise"
                                                name="type_entreprise"
                                                value={formulaire.type_entreprise}
                                                onChange={modifierChamp}
                                            >
                                                <option value="privee">
                                                    Entreprise privée
                                                </option>

                                                <option value="publique">
                                                    Entreprise publique
                                                </option>

                                                <option value="startup">
                                                    Startup
                                                </option>

                                                <option value="ong">
                                                    ONG ou association
                                                </option>

                                                <option value="autre">
                                                    Autre
                                                </option>
                                            </select>
                                        </div>

                                        <div className="inscription-field">
                                            <label htmlFor="telephone">
                                                Téléphone professionnel
                                            </label>

                                            <input
                                                id="telephone"
                                                name="telephone"
                                                type="tel"
                                                value={formulaire.telephone}
                                                onChange={modifierChamp}
                                                placeholder="Téléphone professionnel"
                                            />
                                        </div>

                                        <div className="inscription-field">
                                            <label htmlFor="ville">
                                                Ville
                                            </label>

                                            <input
                                                id="ville"
                                                name="ville"
                                                type="text"
                                                value={formulaire.ville}
                                                onChange={modifierChamp}
                                                placeholder="Ex. Douala"
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="site_web">
                                                Site web
                                            </label>

                                            <input
                                                id="site_web"
                                                name="site_web"
                                                type="url"
                                                value={formulaire.site_web}
                                                onChange={modifierChamp}
                                                placeholder="https://www.exemple.com"
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="description">
                                                Présentation détaillée
                                            </label>

                                            <textarea
                                                id="description"
                                                name="description"
                                                rows="5"
                                                value={formulaire.description}
                                                onChange={modifierChamp}
                                                placeholder="Présentez vos activités, services et objectifs."
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="document_presentation">
                                                Document de présentation
                                            </label>

                                            <input
                                                id="document_presentation"
                                                name="document_presentation"
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(event) =>
                                                    setDocumentEntreprise(
                                                        event.target.files[0] || null
                                                    )
                                                }
                                            />

                                            <small>
                                                Facultatif : PDF, DOC ou DOCX,
                                                10 Mo maximum.
                                            </small>
                                        </div>

                                    </div>
                                </>
                            )}

                            {/* Informations de l'administrateur */}

                            {role === "administrateur" && (
                                <>
                                    <h2 className="inscription-section-title">
                                        <i className="fas fa-user-shield"></i>
                                        Informations de l'administrateur
                                    </h2>

                                    <div className="inscription-grid">

                                        <div className="inscription-field full-width">
                                            <label htmlFor="nom">
                                                Nom complet *
                                            </label>

                                            <input
                                                id="nom"
                                                name="nom"
                                                type="text"
                                                value={formulaire.nom}
                                                onChange={modifierChamp}
                                                placeholder="Prénom et nom"
                                                autoComplete="name"
                                                required
                                            />
                                        </div>

                                        <div className="inscription-field full-width">
                                            <label htmlFor="code_autorisation">
                                                Code d'autorisation *
                                            </label>

                                            <input
                                                id="code_autorisation"
                                                name="code_autorisation"
                                                type="password"
                                                value={formulaire.code_autorisation}
                                                onChange={modifierChamp}
                                                placeholder="Entre le code d'autorisation"
                                                autoComplete="off"
                                                required
                                            />

                                            <small>
                                                Ce code doit être vérifié par Django
                                                avant la création du compte.
                                            </small>
                                        </div>

                                    </div>
                                </>
                            )}

                            {/* Informations de connexion */}

                            <h2 className="inscription-section-title">
                                <i className="fas fa-lock"></i>
                                Informations de connexion
                            </h2>

                            <div className="inscription-grid">

                                <div className="inscription-field full-width">
                                    <label htmlFor="email">
                                        Adresse e-mail *
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formulaire.email}
                                        onChange={modifierChamp}
                                        placeholder="exemple@email.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <div className="inscription-field">
                                    <label htmlFor="motdepasse">
                                        Mot de passe *
                                    </label>

                                    <input
                                        id="motdepasse"
                                        name="motdepasse"
                                        type="password"
                                        value={formulaire.motdepasse}
                                        onChange={modifierChamp}
                                        placeholder="Créer un mot de passe"
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>

                                <div className="inscription-field">
                                    <label htmlFor="confirmation">
                                        Confirmer le mot de passe *
                                    </label>

                                    <input
                                        id="confirmation"
                                        name="confirmation"
                                        type="password"
                                        value={formulaire.confirmation}
                                        onChange={modifierChamp}
                                        placeholder="Répéter le mot de passe"
                                        autoComplete="new-password"
                                        required
                                    />
                                </div>

                            </div>

                            {/* Bouton d'inscription */}

                            <button
                                type="submit"
                                className="inscription-submit"
                                disabled={chargement}
                            >
                                {chargement ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i>
                                        Création du compte...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-user-plus"></i>
                                        Créer mon compte
                                    </>
                                )}
                            </button>

                            <div className="inscription-login">
                                Tu as déjà un compte ?{" "}
                                <a href="/connexion.html">
                                    Connecte-toi
                                </a>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
