import "./header.css";

function Header() {
return ( <header className="sticky-top"> <div className="container-fluid"> <nav className="navbar navbar-expand-lg navbar-light head"> <div className="container-fluid long">


                    <a className="navbar-brand app text-white" href="/acceuiltotal/acceuil%20total.html">
                        app-retruct
                    </a>

                    <div className="hum">


                        <div
                            className="collapse navbar-collapse dev d-flex ju"
                            id="navbarSupportedContent"
                        >
                            <ul className="navbar-nav me-auto mb-2 mb-lg-0">

                                <li className="nav-item d1">
                                    <a
                                        className="nav-link lien1 li"
                                        aria-current="page"
                                        href="/acceuiltotal/acceuil%20total.html"
                                    >
                                        &nbsp;accueil&nbsp;
                                    </a>
                                </li>

                                <li className="nav-item">
                                    <a className="nav-link lien li1 text-white" href="/apropos.html">
                                        &nbsp;a propos&nbsp;
                                    </a>
                                </li>

                            </ul>
                        </div>

                        <div className="header-actions">
                            <a className="nav-link lien li12 text-white" href="/connexion/connexion.html">
                                Connexion
                            </a>
                        </div>

                    </div>
                </div>
            </nav>
        </div>
    </header>
);


}

export default Header;
