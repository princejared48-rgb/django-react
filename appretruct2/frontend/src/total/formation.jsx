import React from "react";
import "./formation.css";

const formations = [
{
id: 1,
nom: "Développement web",
icone: "fa-solid fa-code",
description: "Évaluez vos connaissances en développement web."
},
{
id: 2,
nom: "Cybersécurité",
icone: "fa-solid fa-shield-halved",
description: "Testez vos connaissances en cybersécurité."
},
{
id: 3,
nom: "Auxiliaire de vie",
icone: "fa-solid fa-heart-pulse",
description: "Évaluez vos connaissances dans l'accompagnement des personnes."
},
{
id: 4,
nom: "Marketing digital",
icone: "fa-solid fa-bullhorn",
description: "Testez vos connaissances en marketing digital."
},
{
id: 5,
nom: "Secrétariat médical",
icone: "fa-solid fa-file-medical",
description: "Évaluez vos connaissances en secrétariat médical."
},
{
id: 6,
nom: "Secrétariat normal",
icone: "fa-solid fa-file-lines",
description: "Testez vos connaissances en secrétariat et bureautique."
},
{
id: 7,
nom: "Vente en pharmacie",
icone: "fa-solid fa-prescription-bottle-medical",
description: "Évaluez vos connaissances en vente en pharmacie."
}
];

function Formations() {
return ( <section className="formations-section"> <div className="formations-container">


            <div className="formations-heading">
                <span className="formations-label">APPRETRUCT </span>

                <h2>Nos formations</h2>

                <p>
                    Choisissez votre formation et préparez-vous
                    à passer votre évaluation.
                </p>
            </div>

            <div className="formations-grid">
                {formations.map((formation) => (
                    <article className="formation-card" key={formation.id}>

                        <div className="formation-icon">
                            <i className={formation.icone}></i>
                        </div>

                        <span className="formation-number">
                            FORMATION 0{formation.id}
                        </span>

                        <h3>{formation.nom}</h3>

                        <p>{formation.description}</p>

                        <button
                            type="button"
                            className="formation-button"
                            onClick={() => {
                                alert(
                                    `Vous avez choisi : ${formation.nom}`
                                );
                            }}
                        >
                            Commencer l'évaluation
                            <i className="fa-solid fa-arrow-right"></i>
                        </button>

                    </article>
                ))}
            </div>

        </div>
    </section>
);


}

export default Formations;
