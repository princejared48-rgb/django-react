import "./shared/galaxy.css";

function Footer() {
    return (
        <footer className="gx-footer">
            <section className="gx-footer-social">
                <div className="gx-footer-social-title">
                    Contactez-nous sur les réseaux sociaux
                </div>

                <div className="gx-social-links">
                    <a
                        href="https://www.facebook.com/jared.22596"
                        target="_blank"
                        rel="noreferrer"
                        className="gx-social-link"
                        aria-label="Facebook"
                    >
                        <i className="fab fa-facebook-f" />
                    </a>

                    <a
                        href="https://twitter.com/JARED20090"
                        target="_blank"
                        rel="noreferrer"
                        className="gx-social-link"
                        aria-label="X"
                    >
                        <i className="fab fa-x-twitter" />
                    </a>

                    <a
                        href="mailto:princejared48@gmail.com"
                        className="gx-social-link"
                        aria-label="E-mail"
                    >
                        <i className="fas fa-envelope" />
                    </a>

                    <a
                        href="https://www.instagram.com/jared925941"
                        target="_blank"
                        rel="noreferrer"
                        className="gx-social-link"
                        aria-label="Instagram"
                    >
                        <i className="fab fa-instagram" />
                    </a>

                    <a
                        href="https://www.linkedin.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="gx-social-link"
                        aria-label="LinkedIn"
                    >
                        <i className="fab fa-linkedin-in" />
                    </a>

                    <a
                        href="https://github.com/princejared48-rgb"
                        target="_blank"
                        rel="noreferrer"
                        className="gx-social-link"
                        aria-label="GitHub"
                    >
                        <i className="fab fa-github" />
                    </a>

                    <a
                        href="https://wa.me/237677064542?text=Bonjour%20je%20vous%20contacte%20depuis%20votre%20site"
                        target="_blank"
                        rel="noreferrer"
                        className="gx-social-link"
                        aria-label="WhatsApp"
                    >
                        <i className="fab fa-whatsapp" />
                    </a>
                </div>
            </section>

            <section className="gx-footer-main">
                <div className="gx-container gx-footer-grid">
                    <div className="gx-footer-col gx-footer-brand">
                        <h3>
                            <i className="fas fa-gem" /> APPRETRUCT
                        </h3>

                        <p>
                            Trouvez les meilleures offres d'emploi et recrutez les
                            meilleurs talents grâce à notre plateforme simple, rapide
                            et sécurisée.
                        </p>
                    </div>

                    <div className="gx-footer-col">
                        <h3>Navigation</h3>
                        <a href="/acceuiltotal/acceuiltotal.html">Accueil</a>
                        <a href="/acceuiltotal/acceuiltotal.html#formations">
                            Formations
                        </a>
                        <a href="/connexion/connexion.html">Connexion</a>
                        <a href="/inscription/inscription.html">Inscription</a>
                    </div>

                    <div className="gx-footer-col">
                        <h3>Espaces</h3>
                        <a href="/utilisateur/tabbord.html">Espace candidat</a>
                        <a href="/entreprise/tabbord.html">Espace entreprise</a>
                        <a href="/administrateur/tabbord.html">Administration</a>
                    </div>

                    <div className="gx-footer-col gx-footer-contact">
                        <h3>Contact</h3>

                        <p>
                            <i className="fas fa-location-dot" />
                            <span>Douala, Cameroun</span>
                        </p>

                        <p>
                            <i className="fas fa-envelope" />
                            <a href="mailto:princejared@gmail.com">
                                princejared@gmail.com
                            </a>
                        </p>

                        <p>
                            <i className="fas fa-phone" />
                            <a href="tel:+237677064542">+237 677 06 45 42</a>
                        </p>

                        <p>
                            <i className="fas fa-print" />
                            <a href="tel:+237699881581">+237 699 88 15 81</a>
                        </p>
                    </div>
                </div>
            </section>

            <div className="gx-footer-bottom">
                © 2026 Copyright :{" "}
                <a href="mailto:princejared@gmail.com">Jared</a> — Tous droits
                réservés.
            </div>
        </footer>
    );
}

export default Footer;
