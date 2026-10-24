import React from "react";
import "./carrosel.css";

function Carrosel() {
const images = [
{
image: "/asset/pexels-cedric-eriale-416969752-16924773.jpg",
titre: "Trouvez l'emploi qui correspond à vos ambitions",
description:
"Découvrez des milliers d'opportunités professionnelles auprès des meilleures entreprises.",
alt: "Professionnels en réunion"
},
{
image: "/asset/3b99f3a76232c8997108854c7e96085c.jpg",
titre: "Votre carrière commence ici",
description:
"Créez votre profil, déposez votre CV et trouvez rapidement l'offre qui vous correspond.",
alt: "Candidate travaillant sur un ordinateur"
},
{
image: "/asset/pexels-tima-miroshnichenko-5439140.jpg",
titre: "Recrutez les meilleurs talents",
description:
"Publiez vos offres et trouvez les candidats qualifiés pour développer votre entreprise.",
alt: "Équipe professionnelle en entretien"
}
];


return (
    <section className="container-fluid carrosel">
        <div
            id="carouselAppretruct"
            className="carousel slide"
            data-bs-ride="carousel"
        >
            <div className="carousel-indicators">
                {images.map((element, index) => (
                    <button
                        key={element.image}
                        type="button"
                        data-bs-target="#carouselAppretruct"
                        data-bs-slide-to={index}
                        className={index === 0 ? "active" : ""}
                        aria-current={index === 0 ? "true" : undefined}
                        aria-label={`Slide ${index + 1}`}
                    />
                ))}
            </div>

            <div className="carousel-inner">
                {images.map((element, index) => (
                    <div
                        key={element.image}
                        className={`carousel-item haut ${
                            index === 0 ? "active" : ""
                        }`}
                    >
                        <img
                            src={element.image}
                            className="d-block w-100"
                            alt={element.alt}
                        />

                        <div className="carousel-caption d5">
                            <h5>{element.titre}</h5>
                            <p>{element.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#carouselAppretruct"
                data-bs-slide="prev"
                aria-label="Image précédente"
            >
                <span
                    className="carousel-control-prev-icon"
                    aria-hidden="true"
                />
            </button>

            <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#carouselAppretruct"
                data-bs-slide="next"
                aria-label="Image suivante"
            >
                <span
                    className="carousel-control-next-icon"
                    aria-hidden="true"
                />
            </button>
        </div>
    </section>
);

}

export default Carrosel;
