import "./appretruct.css";

const menus = {
  public: [["Accueil","/acceuiltotal/acceuiltotal.html","fa-house"],["À propos","#apropos","fa-circle-info"],["Formations","#formations","fa-graduation-cap"]],
  utilisateur: [["Tableau de bord","/utilisateur/acceuilutilisateurhtml","fa-gauge"],["Mon profil","/utilisateur/tabbord.html","fa-user"],["Accueil du site","/acceuiltotal/acceuiltotal.html","fa-house"]],
  entreprise: [["Tableau de bord","/entreprise/acceuilentreprise.html","fa-gauge"],["Mon profil","/entreprise/tabbord.html","fa-building"],["Accueil du site","/acceuiltotal/acceuiltotal.html","fa-house"]],
  administrateur: [["Tableau de bord","/administrateur/acceuiladministrateur.html","fa-gauge"],["Comptes inscrits","/administrateur/tabbord.html","fa-users"],["Accueil du site","/acceuiltotal/acceuiltotal.html","fa-house"]]
};

export function HeaderApp({role="public"}) {
  const titre = role === "public" ? "Plateforme de recrutement" : ({utilisateur:"Espace candidat",entreprise:"Espace entreprise",administrateur:"Espace administrateur"}[role]);
  return <header className="app-header">
    <a className="app-logo" href="/acceuiltotal/acceuiltotal.html"><span className="app-logo-icon"><i className="fa-solid fa-atom"/></span><span>APPRETRUCT<small>{titre}</small></span></a>
    <nav className="app-nav">{menus[role].map(([label,url,icon])=><a key={label} href={url}><i className={`fa-solid ${icon}`}/>{label}</a>)}</nav>
    <div className="app-header-actions">
      {role==="public" ? <a className="app-login" href="/connexion/connexion.html">Connexion</a> : <a className="app-login" href="/deconnexion/">Déconnexion</a>}
    </div>
  </header>;
}

export function FooterApp(){
 return <footer className="app-footer"><div><strong>APPRETRUCT</strong><p>La rencontre entre les talents et les opportunités.</p></div><span>© {new Date().getFullYear()} APPRETRUCT — Tous droits réservés.</span></footer>
}

export function PageDashboard({role}){
 const config={
  utilisateur:{eyebrow:"ESPACE CANDIDAT",title:"Bienvenue dans votre espace",desc:"Préparez votre profil et suivez votre parcours professionnel.",cards:[["Mon profil","Consultez et mettez à jour vos informations personnelles.","/utilisateur/tabbord.html","fa-user"],["Mon CV","Retrouvez les informations liées à votre candidature.","/utilisateur/tabbord.html","fa-file-lines"],["Opportunités","Préparez-vous à découvrir des offres adaptées à votre profil.","#","fa-briefcase"]]},
  entreprise:{eyebrow:"ESPACE ENTREPRISE",title:"Pilotez vos recrutements",desc:"Gérez les informations de votre entreprise et préparez vos recrutements.",cards:[["Profil entreprise","Consultez et actualisez les informations de votre structure.","/entreprise/tabbord.html","fa-building"],["Offres d'emploi","Accédez à votre espace de gestion des offres.","#","fa-briefcase"],["Candidats","Retrouvez les fonctionnalités liées aux candidatures.","#","fa-users"]]},
  administrateur:{eyebrow:"CENTRE DE CONTRÔLE",title:"Administration APPRETRUCT",desc:"Suivez les comptes et accédez rapidement aux espaces de gestion.",cards:[["Comptes inscrits","Consultez les comptes des entreprises, candidats et administrateurs.","/administrateur/tabbord.html","fa-users"],["Entreprises","Accédez à la gestion des comptes entreprise.","/administrateur/tabbord.html#entreprises","fa-building"],["Candidats","Accédez à la gestion des comptes candidats.","/administrateur/tabbord.html#candidats","fa-user-tie"],["Administrateurs","Consultez les comptes administrateurs.","/administrateur/tabbord.html#administrateurs","fa-user-shield"]]}
 }[role];
 return <main className="dashboard-main"><div className="dashboard-heading"><div><span className="eyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>{config.desc}</p></div><span className="dashboard-badge"><i className="fa-solid fa-shield-halved"/> Espace sécurisé</span></div>
 <section className="dashboard-grid">{config.cards.map(([title,desc,url,icon])=><a className="dashboard-card" href={url} key={title}><span className="dashboard-card-icon"><i className={`fa-solid ${icon}`}/></span><h2>{title}</h2><p>{desc}</p><span className="card-link">Accéder <i className="fa-solid fa-arrow-right"/></span></a>)}</section>
 <section className="dashboard-info"><i className="fa-solid fa-circle-info"/><div><strong>Votre espace APPRETRUCT</strong><p>Utilisez les cartes ci-dessus pour accéder aux fonctionnalités disponibles. Les nouvelles fonctionnalités seront ajoutées progressivement.</p></div></section>
 </main>
}
