
import json

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import (
    ProfilCompte,
    ProfilCandidat,
    ProfilEntreprise,
)


# ==========================================================
# 1. FONCTIONS UTILITAIRES
# ==========================================================

TAILLE_MAX_FICHIER = 10 * 1024 * 1024  # 10 Mo


def reponse_erreur(message, statut=400, details=None):
    """Retourne une réponse JSON contenant une erreur."""

    resultat = {"message": message}

    if details is not None:
        resultat["details"] = details

    return JsonResponse(resultat, status=statut)


def lire_texte(donnees, champ):
    """Récupère un champ texte et supprime les espaces extérieurs."""

    valeur = donnees.get(champ, "")

    if not isinstance(valeur, str):
        return ""

    return valeur.strip()


def lire_mot_de_passe(donnees, champ):
    """Récupère un mot de passe sans modifier sa valeur."""

    valeur = donnees.get(champ, "")

    if isinstance(valeur, str):
        return valeur

    return ""


def verifier_fichier(fichier):
    """Vérifie l'extension et la taille d'un fichier envoyé."""

    if fichier.size > TAILLE_MAX_FICHIER:
        raise ValidationError(
            "Le fichier ne doit pas dépasser 10 Mo."
        )

    if "." not in fichier.name:
        raise ValidationError(
            "Le fichier ne possède pas d'extension valide."
        )

    extension = fichier.name.rsplit(".", 1)[-1].lower()

    if extension not in ["pdf", "doc", "docx"]:
        raise ValidationError(
            "Formats autorisés : PDF, DOC et DOCX."
        )


# ==========================================================
# 2. PRÉPARER LE JETON CSRF POUR REACT
# ==========================================================

@ensure_csrf_cookie
@require_GET
def obtenir_jeton_csrf(request):
    """Prépare le cookie CSRF nécessaire aux requêtes React."""

    return JsonResponse({
        "message": "La préparation CSRF a réussi."
    })


# ==========================================================
# 3. INSCRIPTION D'UN CANDIDAT OU D'UNE ENTREPRISE
# ==========================================================

@require_POST
def inscription_api(request):
    """
    Enregistre un candidat ou une entreprise.

    La création d'un compte administrateur est volontairement
    désactivée dans cette inscription publique.
    """

    # ------------------------------------------------------
    # A. Lire les données envoyées par React
    # ------------------------------------------------------

    try:
        if request.content_type == "application/json":

            donnees = json.loads(
                request.body.decode("utf-8")
            )

            if not isinstance(donnees, dict):
                return reponse_erreur(
                    "Les données envoyées sont invalides."
                )

            fichiers = {}

        else:
            # Prend en charge FormData et les fichiers envoyés
            # par le formulaire React.
            donnees = request.POST
            fichiers = request.FILES

    except (json.JSONDecodeError, UnicodeDecodeError):
        return reponse_erreur(
            "Impossible de lire les données envoyées."
        )

    # ------------------------------------------------------
    # B. Récupérer les champs communs
    # ------------------------------------------------------

    role = lire_texte(donnees, "role").lower()
    email = lire_texte(donnees, "email").lower()

    motdepasse = lire_mot_de_passe(
        donnees, "motdepasse"
    )

    confirmation = lire_mot_de_passe(
        donnees, "confirmation"
    )

    # ------------------------------------------------------
    # C. Vérifier le type de compte
    # ------------------------------------------------------

    if role == "administrateur":
        return reponse_erreur(
            (
                "L'inscription administrateur n'est pas encore "
                "disponible. Cette fonctionnalité sera ajoutée "
                "ultérieurement."
            ),
            statut=403,
        )

    if role not in ["utilisateur", "entreprise"]:
        return reponse_erreur(
            "Le type de compte est invalide."
        )

    # ------------------------------------------------------
    # D. Vérifier les champs obligatoires
    # ------------------------------------------------------

    if not email or not motdepasse or not confirmation:
        return reponse_erreur(
            "L'e-mail et les deux champs de mot de passe sont obligatoires."
        )

    if motdepasse != confirmation:
        return reponse_erreur(
            "Les deux mots de passe ne correspondent pas."
        )

    try:
        validate_email(email)

    except ValidationError:
        return reponse_erreur(
            "L'adresse e-mail n'est pas valide."
        )

    # ------------------------------------------------------
    # E. Vérifier la solidité du mot de passe
    # ------------------------------------------------------

    try:
        validate_password(motdepasse)

    except ValidationError as erreur:
        return reponse_erreur(
            "Le mot de passe ne respecte pas les exigences de sécurité.",
            details=erreur.messages,
        )

    # ------------------------------------------------------
    # F. Vérifier que l'e-mail n'est pas déjà utilisé
    # ------------------------------------------------------

    UtilisateurDjango = get_user_model()

    if UtilisateurDjango.objects.filter(
        email__iexact=email
    ).exists():
        return reponse_erreur(
            "Cette adresse e-mail est déjà utilisée.",
            statut=409,
        )

    donnees_candidat = None
    donnees_entreprise = None

    # ------------------------------------------------------
    # G. Préparer les informations du candidat
    # ------------------------------------------------------

    if role == "utilisateur":

        prenom_saisi = lire_texte(
            donnees, "prenom"
        )

        nom_famille_saisi = lire_texte(
            donnees, "nom_famille"
        )

        if prenom_saisi and (
            nom_famille_saisi or lire_texte(donnees, "nom")
        ):
            prenom = prenom_saisi

            nom = (
                nom_famille_saisi
                or lire_texte(donnees, "nom")
            )

        else:
            # Le formulaire peut envoyer le nom complet dans
            # un seul champ appelé « nom ».
            nom_complet = (
                lire_texte(donnees, "nom_complet")
                or lire_texte(donnees, "nom")
            )

            parties = nom_complet.split(maxsplit=1)

            if len(parties) < 2:
                return reponse_erreur(
                    (
                        "Saisis le prénom et le nom de famille "
                        "dans le champ Nom complet."
                    )
                )

            prenom = parties[0]
            nom = parties[1]

        # Date de naissance facultative
        date_naissance = lire_texte(
            donnees, "date_naissance"
        )

        if date_naissance:
            date_naissance = parse_date(date_naissance)

            if date_naissance is None:
                return reponse_erreur(
                    "La date de naissance est invalide."
                )

        else:
            date_naissance = None

        # Préparer les données correspondant à ProfilCandidat
        donnees_candidat = {
            "nom": nom,
            "prenom": prenom,
            "telephone": lire_texte(
                donnees, "telephone"
            ),
            "date_naissance": date_naissance,
            "ville": lire_texte(
                donnees, "ville"
            ),
            "domaine": lire_texte(
                donnees, "domaine"
            ),
            "titre_professionnel": lire_texte(
                donnees, "titre_professionnel"
            ),
            "experience": lire_texte(
                donnees, "experience"
            ),
            "competences": lire_texte(
                donnees, "competences"
            ),
            "presentation": lire_texte(
                donnees, "presentation"
            ),
            "linkedin": lire_texte(
                donnees, "linkedin"
            ),
            "portfolio": lire_texte(
                donnees, "portfolio"
            ),
        }

        # CV facultatif
        cv = fichiers.get("cv")

        if cv:
            try:
                verifier_fichier(cv)

            except ValidationError as erreur:
                return reponse_erreur(
                    "Le CV fourni n'est pas valide.",
                    details=erreur.messages,
                )

    # ------------------------------------------------------
    # H. Préparer les informations de l'entreprise
    # ------------------------------------------------------

    else:

        nom_entreprise = lire_texte(
            donnees, "nom_entreprise"
        )

        domaine = (
            lire_texte(donnees, "domaine_activite")
            or lire_texte(donnees, "domaine")
        )

        if not nom_entreprise or not domaine:
            return reponse_erreur(
                (
                    "Le nom de l'entreprise et son domaine "
                    "d'activité sont obligatoires."
                )
            )

        donnees_entreprise = {
            "nom_entreprise": nom_entreprise,
            "domaine_activite": domaine,
            "secteur_activite": lire_texte(
                donnees, "secteur_activite"
            ),
            "type_entreprise": (
                lire_texte(donnees, "type_entreprise")
                or "privee"
            ),
            "site_web": lire_texte(
                donnees, "site_web"
            ),
            "telephone": lire_texte(
                donnees, "telephone"
            ),
            "ville": lire_texte(
                donnees, "ville"
            ),
            "adresse": lire_texte(
                donnees, "adresse"
            ),
            "description": lire_texte(
                donnees, "description"
            ),
            "effectif": lire_texte(
                donnees, "effectif"
            ),
        }

        # Année de création facultative
        annee_creation = lire_texte(
            donnees, "annee_creation"
        )

        if annee_creation:
            try:
                donnees_entreprise["annee_creation"] = int(
                    annee_creation
                )

            except ValueError:
                return reponse_erreur(
                    "L'année de création doit être un nombre."
                )

        # Coordonnées géographiques facultatives
        latitude = lire_texte(
            donnees, "latitude"
        )

        longitude = lire_texte(
            donnees, "longitude"
        )

        if bool(latitude) != bool(longitude):
            return reponse_erreur(
                (
                    "La latitude et la longitude doivent "
                    "être renseignées ensemble."
                )
            )

        if latitude and longitude:
            try:
                donnees_entreprise["latitude"] = float(latitude)
                donnees_entreprise["longitude"] = float(longitude)

            except ValueError:
                return reponse_erreur(
                    "Les coordonnées géographiques sont invalides."
                )

        # Document de présentation facultatif
        document = fichiers.get(
            "document_presentation"
        )

        if document:
            try:
                verifier_fichier(document)

            except ValidationError as erreur:
                return reponse_erreur(
                    "Le document de présentation n'est pas valide.",
                    details=erreur.messages,
                )

    # ------------------------------------------------------
    # I. Créer le compte et son profil
    # ------------------------------------------------------

    try:
        with transaction.atomic():

            # Préparer les champs du compte Django
            champs_creation = {
                "email": email,
                "password": motdepasse,
            }

            # Si le modèle Django possède un champ username,
            # utiliser l'adresse e-mail comme nom d'utilisateur.
            try:
                UtilisateurDjango._meta.get_field("username")

            except FieldDoesNotExist:
                pass

            else:
                champs_creation["username"] = email

            # Django hache le mot de passe avec create_user().
            compte_django = (
                UtilisateurDjango.objects.create_user(
                    **champs_creation
                )
            )

            # Créer le profil commun Appretruct
            profil_compte = ProfilCompte.objects.create(
                utilisateur=compte_django,
                type_compte=role,
            )

            if role == "utilisateur":

                candidat = ProfilCandidat(
                    compte=profil_compte,
                    **donnees_candidat,
                )

                cv = fichiers.get("cv")

                if cv:
                    candidat.cv = cv

                candidat.full_clean()
                candidat.save()

            else:

                entreprise = ProfilEntreprise(
                    compte=profil_compte,
                    **donnees_entreprise,
                )

                document = fichiers.get(
                    "document_presentation"
                )

                if document:
                    entreprise.document_presentation = document

                entreprise.full_clean()
                entreprise.save()

    except ValidationError as erreur:

        details = getattr(
            erreur,
            "message_dict",
            None,
        ) or erreur.messages

        return reponse_erreur(
            "Certaines informations sont invalides.",
            details=details,
        )

    except IntegrityError:
        return reponse_erreur(
            (
                "Impossible de créer ce compte. "
                "Vérifie que l'adresse e-mail n'est pas déjà utilisée."
            ),
            statut=409,
        )

    # ------------------------------------------------------
    # J. Confirmer l'inscription à React
    # ------------------------------------------------------

    return JsonResponse(
        {
            "message": "Le compte a été créé avec succès.",
            "role": role,
            "email": email,
        },
        status=201,
    )


# ==========================================================
# 4. RÉCUPÉRER LES INSCRIPTIONS POUR LE TABLEAU DE BORD
#    ADMINISTRATEUR
# ==========================================================

@require_GET
def liste_comptes_administrateur_api(request):
    """
    Retourne la liste des comptes Appretruct.

    Cette API est réservée aux administrateurs connectés.
    Elle permettra au tableau de bord de récupérer les
    candidats et les entreprises enregistrés.
    """

    # A. Vérifier la connexion
    if not request.user.is_authenticated:
        return reponse_erreur(
            "Vous devez vous connecter pour consulter les comptes.",
            statut=401,
        )

    # B. Vérifier le rôle de l'utilisateur connecté
    est_administrateur = (
        request.user.is_superuser
        or ProfilCompte.objects.filter(
            utilisateur=request.user,
            type_compte="administrateur",
        ).exists()
    )

    if not est_administrateur:
        return reponse_erreur(
            "Accès réservé aux administrateurs.",
            statut=403,
        )

    # C. Récupérer les comptes et leurs profils associés
    profils = (
        ProfilCompte.objects
        .select_related(
            "utilisateur",
            "candidat",
            "entreprise",
            "administrateur",
        )
        .order_by("-date_creation")
    )

    comptes = []

    for profil in profils:

        compte = {
            "id": profil.id,
            "email": profil.utilisateur.email,
            "role": profil.type_compte,
            "role_libelle": profil.get_type_compte_display(),
            "date_inscription": profil.date_creation.isoformat(),
            "nom_affichage": "",
            "telephone": "",
            "ville": "",
            "domaine": "",
            "document_disponible": False,
        }

        # Candidat
        if profil.type_compte == "utilisateur":

            candidat = getattr(
                profil, "candidat", None
            )

            if candidat:
                compte.update({
                    "nom_affichage": (
                        f"{candidat.prenom} {candidat.nom}"
                    ),
                    "telephone": candidat.telephone,
                    "ville": candidat.ville,
                    "domaine": candidat.domaine,
                    "document_disponible": bool(candidat.cv),
                })

        # Entreprise
        elif profil.type_compte == "entreprise":

            entreprise = getattr(
                profil, "entreprise", None
            )

            if entreprise:
                compte.update({
                    "nom_affichage": entreprise.nom_entreprise,
                    "telephone": entreprise.telephone,
                    "ville": entreprise.ville,
                    "domaine": entreprise.domaine_activite,
                    "document_disponible": bool(
                        entreprise.document_presentation
                    ),
                })

        # Administrateur : prévu pour une étape ultérieure
        elif profil.type_compte == "administrateur":

            administrateur = getattr(
                profil, "administrateur", None
            )

            if administrateur:
                compte.update({
                    "nom_affichage": (
                        f"{administrateur.prenom} "
                        f"{administrateur.nom}"
                    ),
                    "telephone": administrateur.telephone,
                })

        comptes.append(compte)

    # D. Renvoyer les données au tableau de bord React
    return JsonResponse({
        "total": len(comptes),
        "comptes": comptes,
    })