import "./footer.css";

function Footer() {
return ( <footer className="app-footer"> <section className="footer-social"> <div className="footer-social-title"> <span>Contactez-nous sur les réseaux sociaux :</span> </div>


    <div className="footer-social-links">
      <a href="https://www.facebook.com/jared.22596" target="_blank" rel="noreferrer" className="social-link facebook" aria-label="Facebook">
        <i className="fab fa-facebook-f"></i>
      </a>

      <a href="https://twitter.com/JARED20090" target="_blank" rel="noreferrer" className="social-link twitter" aria-label="X">
        <i className="fab fa-x-twitter"></i>
      </a>

      <a href="mailto:princejared48@gmail.com" className="social-link email" aria-label="E-mail">
        <i className="fas fa-envelope"></i>
      </a>

      <a href="https://www.instagram.com/jared925941" target="_blank" rel="noreferrer" className="social-link instagram" aria-label="Instagram">
        <i className="fab fa-instagram"></i>
      </a>

      <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" className="social-link linkedin" aria-label="LinkedIn">
        <i className="fab fa-linkedin-in"></i>
      </a>

      <a href="https://github.com/princejared48-rgb" target="_blank" rel="noreferrer" className="social-link github" aria-label="GitHub">
        <i className="fab fa-github"></i>
      </a>

      <a href="https://wa.me/237677064542?text=Bonjour%20je%20vous%20contacte%20depuis%20votre%20site" target="_blank" rel="noreferrer" className="social-link whatsapp" aria-label="WhatsApp">
        <i className="fab fa-whatsapp"></i>
      </a>
    </div>
  </section>

  <section className="footer-main">
    <div className="footer-container">
      <div className="footer-row">
        <div className="footer-column footer-brand">
          <h3>
            <i className="fas fa-gem"></i> APPRETRUCT
          </h3>

          <p>
            Trouvez les meilleures offres d'emploi et recrutez les
            meilleurs talents grâce à notre plateforme simple, rapide
            et sécurisée.
          </p>
        </div>

        <div className="footer-column">
          <h3>Navigation</h3>
          <a href="/">Accueil</a>
          <a href="/offres">Offres d'emploi</a>
          <a href="/entreprises">Entreprises</a>
          <a href="/candidatures">Candidatures</a>
          <a href="/tableau-de-bord">Tableau de bord</a>
          <a href="/contact">Contact</a>
        </div>

        <div className="footer-column">
          <h3>À propos</h3>
          <a href="/faq">FAQ</a>
          <a href="/conditions">Conditions d'utilisation</a>
          <a href="/confidentialite">Politique de confidentialité</a>
          <a href="/rejoindre">Nous rejoindre</a>
        </div>

        <div className="footer-column footer-contact">
          <h3>Contact</h3>

          <p>
            <i className="fas fa-home"></i>
            <span>Douala, Cameroun</span>
          </p>

          <p>
            <i className="fas fa-envelope"></i>
            <a href="mailto:princejared@gmail.com">
              princejared@gmail.com
            </a>
          </p>

          <p>
            <i className="fas fa-phone"></i>
            <a href="tel:+237677064542">+237 677 06 45 42</a>
          </p>

          <p>
            <i className="fas fa-print"></i>
            <a href="tel:+237699881581">+237 699 88 15 81</a>
          </p>
        </div>
      </div>
    </div>
  </section>

  <div className="footer-copyright">
    © 2026 Copyright :{" "}
    <a href="mailto:princejared@gmail.com">Jared</a>
    {" "} — Tous droits réservés.
  </div>
</footer>

);
}

export default Footer;
