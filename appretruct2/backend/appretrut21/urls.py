
from django.urls import path
from . import views

urlpatterns = [
    # =====================================================
    # AUTHENTIFICATION
    # =====================================================

    # Jeton CSRF
    path(
        "csrf/",
        views.obtenir_jeton_csrf,
        name="obtenir_jeton_csrf",
    ),

    # Inscription
    path(
        "inscription/",
        views.inscription_api,
        name="inscription_api",
    ),

    # Connexion
    path(
        "connexion/",
        views.connexion_api,
        name="connexion_api",
    ),

    # Déconnexion
    path(
        "deconnexion/",
        views.deconnexion_api,
        name="deconnexion_api",
    ),

    # =====================================================
    # PROFIL UTILISATEUR (CANDIDAT)
    # =====================================================

    # Consulter le profil
    path(
        "utilisateur/profil/",
        views.profil_utilisateur_api,
        name="profil_utilisateur_api",
    ),

    # Modifier le profil
    path(
        "utilisateur/profil/modifier/",
        views.modifier_profil_utilisateur_api,
        name="modifier_profil_utilisateur_api",
    ),

    # =====================================================
    # PROFIL ENTREPRISE
    # =====================================================

    # Consulter le profil
    path(
        "entreprise/profil/",
        views.profil_entreprise_api,
        name="profil_entreprise_api",
    ),

    # Modifier le profil
    path(
        "entreprise/profil/modifier/",
        views.modifier_profil_entreprise_api,
        name="modifier_profil_entreprise_api",
    ),

    # =====================================================
    # ADMINISTRATEUR
    # =====================================================

    # Liste des comptes
    path(
        "administrateur/comptes/",
        views.liste_comptes_administrateur_api,
        name="liste_comptes_administrateur_api",
    ),
]
