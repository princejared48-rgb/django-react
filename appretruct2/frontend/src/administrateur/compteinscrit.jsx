
import { useEffect, useState } from "react";
import "./compteinscrit.css";

export default function ComptesInscrits() {
    const [comptes, setComptes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [erreur, setErreur] = useState("");
    const [actualisation, setActualisation] = useState(0);

    // ================================================
    // RÉCUPÉRER LES COMPTES DEPUIS DJANGO
    // ================================================

    useEffect(() => {
        const controleur = new AbortController();

        async function chargerComptes() {
            setChargement(true);
            setErreur("");

            try {
                const reponse = await fetch(
                    "/api/administrateur/comptes/",
                    {
                        method: "GET",
                        credentials: "same-origin",
                        headers: {
                            Accept: "application/json",
                        },
                        signal: controleur.signal,
                    }
                );

                const resultat = await reponse.json();

                if (!reponse.ok) {
                    throw new Error(
                        resultat.message ||
                        "Impossible de récupérer les comptes."
                    );
                }

                setComptes(resultat.comptes || []);

            } catch (error) {
                if (error.name !== "AbortError") {
                    setErreur(
                        error.message ||
                        "Une erreur est survenue."
                    );
                }
            } finally {
                if (!controleur.signal.aborted) {
                    setChargement(false);
                }
            }
        }

        chargerComptes();

        return () => {
            controleur.abort();
        };
    }, [actualisation]);


    // ================================================
    // FORMATER LA DATE
    // ================================================

    function formaterDate(date) {
        if (!date) {
            return "—";
        }

        const dateConvertie = new Date(date);

        if (Number.isNaN(dateConvertie.getTime())) {
            return "—";
        }

        return dateConvertie.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }


    // ================================================
    // AFFICHER LE TYPE DE COMPTE
    // ================================================

    function afficherRole(role) {
        switch (role) {
            case "utilisateur":
                return "Candidat";

            case "entreprise":
                return "Entreprise";

            case "administrateur":
                return "Administrateur";

            default:
                return "Inconnu";
        }
    }


    // ================================================
    // AFFICHAGE
    // ================================================

    return (
        <section className="comptes-inscrits">

            {/* En-tête */}
            <div className="comptes-entete">
                <div>
                    <h2 className="comptes-titre">
                        <i className="fas fa-users"></i>
                        Comptes inscrits
                    </h2>

                    <p className="comptes-description">
                        Consulte les candidats et les entreprises
                        enregistrés sur Appretruct.
                    </p>
                </div>

                <div className="comptes-actions">
                    <div className="comptes-total">
                        <i className="fas fa-user-check"></i>
                        Total : {comptes.length}
                    </div>

                    <button
                        type="button"
                        className="bouton-actualiser"
                        onClick={() =>
                            setActualisation(
                                ancienneValeur => ancienneValeur + 1
                            )
                        }
                        disabled={chargement}
                    >
                        <i className="fas fa-sync-alt"></i>
                        Actualiser
                    </button>
                </div>
            </div>


            {/* Chargement */}
            {chargement && (
                <div className="etat-message etat-chargement">
                    <i className="fas fa-spinner fa-spin"></i>
                    Chargement des inscriptions...
                </div>
            )}


            {/* Erreur */}
            {!chargement && erreur && (
                <div className="etat-message etat-erreur" role="alert">
                    <i className="fas fa-exclamation-circle"></i>
                    {erreur}
                </div>
            )}


            {/* Liste des comptes */}
            {!chargement && !erreur && (
                <>
                    {comptes.length === 0 ? (
                        <div className="etat-message etat-vide">
                            <i className="fas fa-inbox"></i>
                            <p>
                                Aucun compte enregistré pour le moment.
                            </p>
                        </div>
                    ) : (
                        <div className="tableau-conteneur">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nom ou entreprise</th>
                                        <th>Type de compte</th>
                                        <th>Adresse e-mail</th>
                                        <th>Téléphone</th>
                                        <th>Ville</th>
                                        <th>Domaine</th>
                                        <th>Document</th>
                                        <th>Date d'inscription</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {comptes.map(compte => (
                                        <tr key={compte.id}>
                                            <td className="nom-compte">
                                                {compte.nom_affichage || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        "badge-role " +
                                                        (
                                                            compte.role === "entreprise"
                                                                ? "badge-entreprise"
                                                                : ""
                                                        )
                                                    }
                                                >
                                                    {afficherRole(compte.role)}
                                                </span>
                                            </td>

                                            <td className="email-compte">
                                                {compte.email || "—"}
                                            </td>

                                            <td>
                                                {compte.telephone || "—"}
                                            </td>

                                            <td>
                                                {compte.ville || "—"}
                                            </td>

                                            <td>
                                                {compte.domaine || "—"}
                                            </td>

                                            <td>
                                                <span
                                                    className={
                                                        compte.document_disponible
                                                            ? "badge-role badge-document"
                                                            : "badge-role badge-absence"
                                                    }
                                                >
                                                    {compte.document_disponible
                                                        ? "Disponible"
                                                        : "Absent"}
                                                </span>
                                            </td>

                                            <td>
                                                {formaterDate(
                                                    compte.date_inscription
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <p className="comptes-pied">
                        <i className="fas fa-info-circle"></i>
                        Les informations proviennent de la base de données
                        Django. Utilise le bouton Actualiser pour recharger
                        la liste.
                    </p>
                </>
            )}
        </section>
    );
}
