import "./galaxy.css";

/*
 * Header unique de la plateforme.
 * Tous les espaces (public, candidat, entreprise, administrateur)
 * utilisent ce même composant afin de garantir un design cohérent.
 */

const configuration = {
    public: {
        home: "/acceuiltotal/acceuiltotal.html",
        subtitle: "PLATEFORME DE RECRUTEMENT",
        links: [
            ["Accueil", "/acceuiltotal/acceuiltotal.html", "fa-house"],
            ["Formations", "#formations", "fa-graduation-cap"],
            ["Connexion", "/connexion/connexion.html", "fa-right-to-bracket"],
        ],
        action: {
            label: "S'inscrire",
            href: "/inscription/inscription.html",
            icon: "fa-user-plus",
        },
    },
    utilisateur: {
        home: "/utilisateur/acceuilutilisateur.html",
        subtitle: "ESPACE CANDIDAT",
        links: [
            ["Accueil", "/utilisateur/acceuilutilisateur.html", "fa-house"],
            ["Mon profil", "/utilisateur/tabbord.html", "fa-user"],
            ["Site public", "/acceuiltotal/acceuiltotal.html", "fa-globe"],
        ],
        action: null,
    },
    entreprise: {
        home: "/entreprise/acceuilentreprise.html",
        subtitle: "ESPACE ENTREPRISE",
        links: [
            ["Accueil", "/entreprise/acceuilentreprise.html", "fa-house"],
            ["Mon profil", "/entreprise/tabbord.html", "fa-building"],
            ["Site public", "/acceuiltotal/acceuiltotal.html", "fa-globe"],
        ],
        action: null,
    },
    administrateur: {
        home: "/administrateur/acceuiladministrateur.html",
        subtitle: "ESPACE ADMINISTRATEUR",
        links: [
            ["Accueil", "/administrateur/acceuiladministrateur.html", "fa-house"],
            ["Comptes inscrits", "/administrateur/tabbord.html", "fa-users"],
            ["Mon profil", "/administrateur/profil.html", "fa-user-shield"],
            ["Site public", "/acceuiltotal/acceuiltotal.html", "fa-globe"],
        ],
        action: null,
    },
};

function lireCookie(nom) {
    const ligne = document.cookie
        .split("; ")
        .find((element) => element.startsWith(`${nom}=`));

    return ligne ? decodeURIComponent(ligne.split("=").slice(1).join("=")) : "";
}

async function seDeconnecter() {
    try {
        // Récupère un jeton CSRF valide, puis termine la session Django.
        await fetch("/api/csrf/", { credentials: "same-origin" });

        await fetch("/api/deconnexion/", {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "X-CSRFToken": lireCookie("csrftoken"),
                Accept: "application/json",
            },
        });
    } catch (erreur) {
        console.error("Erreur de déconnexion :", erreur);
    } finally {
        window.location.assign("/connexion/connexion.html");
    }
}

function estActive(url) {
    if (!url || url.startsWith("#")) {
        return false;
    }

    const pageCourante = window.location.pathname.split("/").pop();
    const pageLien = url.split("/").pop();

    return pageCourante === pageLien;
}

export default function GalaxyHeader({ role = "public" }) {
    const config = configuration[role] || configuration.public;

    return (
        <header className="gx-header">
            <a className="gx-brand" href={config.home}>
                <span className="gx-brand-mark">
                    <i className="fa-solid fa-atom" />
                </span>
                <span>
                    APPRETRUCT
                    <small>{config.subtitle}</small>
                </span>
            </a>

            <nav className="gx-nav" aria-label="Navigation principale">
                {config.links.map(([label, url, icone]) => (
                    <a
                        key={label}
                        href={url}
                        className={estActive(url) ? "active" : undefined}
                    >
                        <i className={`fa-solid ${icone}`} />
                        {label}
                    </a>
                ))}
            </nav>

            <div className="gx-actions">
                {config.action ? (
                    <a className="gx-btn gx-btn-primary" href={config.action.href}>
                        <i className={`fa-solid ${config.action.icon}`} />
                        <span>{config.action.label}</span>
                    </a>
                ) : (
                    <button
                        type="button"
                        className="gx-btn gx-btn-ghost"
                        onClick={seDeconnecter}
                    >
                        <i className="fa-solid fa-right-from-bracket" />
                        <span>Déconnexion</span>
                    </button>
                )}
            </div>
        </header>
    );
}
