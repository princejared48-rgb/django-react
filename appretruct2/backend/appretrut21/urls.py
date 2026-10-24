
from django.urls import path
from . import views

urlpatterns = [
    # 1. Préparer le jeton CSRF pour React
    path(
        "api/csrf/",
        views.obtenir_jeton_csrf,
        name="obtenir_jeton_csrf",
    ),

    # 2. Inscription d'un candidat ou d'une entreprise
    path(
        "api/inscription/",
        views.inscription_api,
        name="inscription_api",
    ),

    # 3. Récupérer les comptes pour le tableau de bord administrateur
    path(
        "api/administrateur/comptes/",
        views.liste_comptes_administrateur_api,
        name="liste_comptes_administrateur_api",
    ),
]
