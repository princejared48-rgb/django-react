# Architecture React proposée pour Appretruct

## Règles retenues
- Tous les fichiers React (`.jsx`) et CSS (`.css`) sont rangés sous `frontend/src/`.
- Une page possède son propre dossier et peut contenir plusieurs fichiers JSX et CSS.
- Chaque page garde son propre Header lorsqu'elle en a besoin.
- Le Footer est le seul élément commun partagé entre les pages.
- Le classement sera accessible depuis les différentes pages dans une étape ultérieure. Les dossiers sont déjà prévus.
- Les fichiers HTML restent les points d'entrée Vite dans leurs dossiers actuels.
- Le backend Django n'est pas réorganisé ni modifié.

## Arborescence cible

```text
frontend/
├── acceuiltotal/acceuiltotal.html
├── connexion/connexion.html
├── inscription/inscription.html
├── utilisateur/
│   ├── acceuilutilisateur.html
│   └── tabbord.html
├── entreprise/
│   ├── acceuilentreprise.html
│   └── tabbord.html
├── administrateur/
│   ├── acceuiladministrateur.html
│   ├── profil.html
│   └── tabbord.html
└── src/
    ├── AccueilTotal/
    ├── Connexion/
    ├── Inscription/
    ├── Utilisateur/
    │   ├── AccueilUtilisateur/
    │   ├── ProfilUtilisateur/
    │   ├── Evaluation/
    │   └── Classement/
    ├── Entreprise/
    │   ├── AccueilEntreprise/
    │   ├── ProfilEntreprise/
    │   ├── Offres/
    │   ├── Contact/
    │   └── TableauDeBord/
    ├── Administrateur/
    │   ├── AccueilAdministrateur/
    │   ├── GestionComptes/
    │   ├── Classement/
    │   └── Statistiques/
    ├── Shared/Footer/
    └── Services/
```

## Important : première étape sans risque
Cette archive prépare l'organisation React, mais ne déplace pas encore les composants existants.
Les anciens fichiers JSX/CSS et les chemins d'import actuels sont conservés pour ne pas casser les pages.
La migration se fera ensuite page par page, avec correction des imports et vérification du build Vite.

## Django
Le dossier `backend/` est conservé. Aucun fichier Python, réglage Django, modèle, vue, URL ou migration n'a été modifié.
