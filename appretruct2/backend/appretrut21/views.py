
import json

from django.conf import settings
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
)
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils.crypto import constant_time_compare
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import (
    ProfilCompte,
    ProfilCandidat,
    ProfilEntreprise,
    Administrateur,
)


# ==========================================================
# 1. CONFIGURATION ET FONCTIONS UTILITAIRES
# ==========================================================

TAILLE_MAX_FICHIER = 10 * 1024 * 1024

DESTINATIONS = {
    "administrateur": "/administrateur/",
    "entreprise": "/entreprise/profil/",
    "utilisateur": "/utilisateur/profil/",
}


def reponse_erreur(message, statut=400, details=None):
    resultat = {"message": message}

    if details is not None:
        resultat["details"] = details

    return JsonResponse(resultat, status=statut)


def lire_texte(donnees, champ):
    valeur = donnees.get(champ, "")

    if not isinstance(valeur, str):
        return ""

    return valeur.strip()


def lire_mot_de_passe(donnees, champ):
    valeur = donnees.get(champ, "")

    if isinstance(valeur, str):
        return valeur

    return ""


def lire_donnees_requete(request):
    """
    Accepte les données JSON et FormData.
    Les fichiers sont récupérés dans request.FILES.
    """
    try:
        if "application/json" in request.content_type:
            donnees = json.loads(
                request.body.decode("utf-8")
            )

            if not isinstance(donnees, dict):
                raise ValueError("Format JSON invalide.")

            return donnees, {}

        return request.POST, request.FILES

    except (
        json.JSONDecodeError,
        UnicodeDecodeError,
        ValueError,
    ):
        return None, None


def verifier_fichier(fichier):
    """
    Vérifie la taille et l'extension du fichier.
    """
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


def obtenir_profil_compte(request, role):
    """
    Récupère le profil Appretruct du compte connecté,
    uniquement si son rôle correspond au rôle demandé.
    """
    if not request.user.is_authenticated:
        return None

    return ProfilCompte.objects.filter(
        utilisateur=request.user,
        type_compte=role,
    ).first()


def obtenir_ou_creer_profil_compte(request, role):
    """
    Récupère le profil existant sans en créer un nouveau.
    """
    return obtenir_profil_compte(request, role)


# ==========================================================
# 2. PRÉPARATION DU JETON CSRF
# ==========================================================

@ensure_csrf_cookie
@require_GET
def obtenir_jeton_csrf(request):
    """
    Prépare le cookie CSRF et renvoie le jeton à React.
    """
    return JsonResponse({
        "message": "La préparation CSRF a réussi.",
        "csrfToken": get_token(request),
    })


# ==========================================================
# 3. INSCRIPTION
# ==========================================================

@require_POST
def inscription_api(request):
    donnees, fichiers = lire_donnees_requete(request)

    if donnees is None:
        return reponse_erreur(
            "Impossible de lire les données envoyées."
        )

    role = lire_texte(donnees, "role").lower()
    email = lire_texte(donnees, "email").lower()

    motdepasse = lire_mot_de_passe(
        donnees, "motdepasse"
    )

    confirmation = lire_mot_de_passe(
        donnees, "confirmation"
    )

    roles_autorises = [
        "utilisateur",
        "entreprise",
        "administrateur",
    ]

    if role not in roles_autorises:
        return reponse_erreur(
            "Le type de compte est invalide."
        )

    # L'inscription administrateur exige un code serveur.
    if role == "administrateur":
        code_saisi = lire_texte(
            donnees, "code_autorisation"
        )

        code_attendu = getattr(
            settings,
            "APPRETRUCT_ADMIN_INSCRIPTION_CODE",
            "",
        )

        if (
            not isinstance(code_attendu, str)
            or not code_attendu.strip()
        ):
            return reponse_erreur(
                "L'inscription administrateur n'est pas configurée.",
                statut=503,
            )

        if not code_saisi or not constant_time_compare(
            code_saisi, code_attendu
        ):
            return reponse_erreur(
                "Le code d'autorisation est incorrect.",
                statut=403,
            )

    if not email or not motdepasse or not confirmation:
        return reponse_erreur(
            "L'e-mail et les deux mots de passe sont obligatoires."
        )

    if motdepasse != confirmation:
        return reponse_erreur(
            "Les mots de passe ne correspondent pas."
        )

    try:
        validate_email(email)
        validate_password(motdepasse)
    except ValidationError as erreur:
        return reponse_erreur(
            "Les données fournies ne sont pas valides.",
            details=erreur.messages,
        )

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
    donnees_administrateur = None

    # ------------------------------------------------------
    # CANDIDAT
    # ------------------------------------------------------

    if role == "utilisateur":
        prenom = lire_texte(donnees, "prenom")

        nom = (
            lire_texte(donnees, "nom_famille")
            or lire_texte(donnees, "nom")
        )

        if not prenom or not nom:
            nom_complet = (
                lire_texte(donnees, "nom_complet")
                or lire_texte(donnees, "nom")
            )

            parties = nom_complet.split(maxsplit=1)

            if len(parties) < 2:
                return reponse_erreur(
                    "Saisis le prénom et le nom de famille."
                )

            prenom = parties[0]
            nom = parties[1]

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
    # ENTREPRISE
    # ------------------------------------------------------

    elif role == "entreprise":
        nom_entreprise = lire_texte(
            donnees, "nom_entreprise"
        )

        domaine = (
            lire_texte(donnees, "domaine_activite")
            or lire_texte(donnees, "domaine")
        )

        if not nom_entreprise or not domaine:
            return reponse_erreur(
                "Le nom de l'entreprise et son domaine sont obligatoires."
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

        latitude = lire_texte(donnees, "latitude")
        longitude = lire_texte(donnees, "longitude")

        if bool(latitude) != bool(longitude):
            return reponse_erreur(
                "La latitude et la longitude doivent être renseignées ensemble."
            )

        if latitude and longitude:
            try:
                donnees_entreprise["latitude"] = float(latitude)
                donnees_entreprise["longitude"] = float(longitude)
            except ValueError:
                return reponse_erreur(
                    "Les coordonnées géographiques sont invalides."
                )

        document = fichiers.get("document_presentation")

        if document:
            try:
                verifier_fichier(document)
            except ValidationError as erreur:
                return reponse_erreur(
                    "Le document de présentation n'est pas valide.",
                    details=erreur.messages,
                )

    # ------------------------------------------------------
    # ADMINISTRATEUR
    # ------------------------------------------------------

    else:
        nom_complet = (
            lire_texte(donnees, "nom")
            or lire_texte(donnees, "nom_complet")
        )

        parties = nom_complet.split()

        if len(parties) < 2:
            return reponse_erreur(
                "Saisis le prénom et le nom de l'administrateur."
            )

        donnees_administrateur = {
            "prenom": parties[0],
            "nom": " ".join(parties[1:]),
            "telephone": lire_texte(
                donnees, "telephone"
            ),
        }

    # ------------------------------------------------------
    # CRÉATION DU COMPTE ET DU PROFIL
    # ------------------------------------------------------

    try:
        with transaction.atomic():
            champs_creation = {
                "email": email,
                "password": motdepasse,
            }

            try:
                UtilisateurDjango._meta.get_field("username")
            except FieldDoesNotExist:
                pass
            else:
                champs_creation["username"] = email

            compte_django = UtilisateurDjango.objects.create_user(
                **champs_creation
            )

            profil_compte = ProfilCompte.objects.create(
                utilisateur=compte_django,
                type_compte=role,
            )

            if role == "utilisateur":
                candidat = ProfilCandidat(
                    compte=profil_compte,
                    **donnees_candidat,
                )

                if fichiers.get("cv"):
                    candidat.cv = fichiers["cv"]

                candidat.full_clean()
                candidat.save()

            elif role == "entreprise":
                entreprise = ProfilEntreprise(
                    compte=profil_compte,
                    **donnees_entreprise,
                )

                if fichiers.get("document_presentation"):
                    entreprise.document_presentation = fichiers[
                        "document_presentation"
                    ]

                entreprise.full_clean()
                entreprise.save()

            else:
                administrateur = Administrateur(
                    compte=profil_compte,
                    **donnees_administrateur,
                )

                administrateur.full_clean()
                administrateur.save()

    except ValidationError as erreur:
        details = (
            getattr(erreur, "message_dict", None)
            or erreur.messages
        )

        return reponse_erreur(
            "Certaines informations sont invalides.",
            details=details,
        )

    except IntegrityError:
        return reponse_erreur(
            "Impossible de créer ce compte. Vérifie l'adresse e-mail.",
            statut=409,
        )

    return JsonResponse(
        {
            "message": "Le compte a été créé avec succès.",
            "role": role,
            "email": email,
        },
        status=201,
    )


# ==========================================================
# 4. CONNEXION ET REDIRECTION SELON LE RÔLE
# ==========================================================

@require_POST
def connexion_api(request):
    donnees, fichiers = lire_donnees_requete(request)

    if donnees is None:
        return reponse_erreur(
            "Impossible de lire les informations envoyées."
        )

    email = lire_texte(donnees, "email").lower()
    motdepasse = lire_mot_de_passe(
        donnees, "motdepasse"
    )

    if not email or not motdepasse:
        return reponse_erreur(
            "Entre ton adresse e-mail et ton mot de passe."
        )

    UtilisateurDjango = get_user_model()

    utilisateur_existant = (
        UtilisateurDjango.objects
        .filter(email__iexact=email)
        .first()
    )

    if utilisateur_existant is None:
        return reponse_erreur(
            "Adresse e-mail ou mot de passe incorrect.",
            statut=401,
        )

    utilisateur = authenticate(
        request,
        username=utilisateur_existant.get_username(),
        password=motdepasse,
    )

    if utilisateur is None:
        return reponse_erreur(
            "Adresse e-mail ou mot de passe incorrect.",
            statut=401,
        )

    profil_compte = ProfilCompte.objects.filter(
        utilisateur=utilisateur
    ).first()

    if profil_compte:
        role = profil_compte.type_compte
    elif utilisateur.is_superuser:
        role = "administrateur"
    else:
        return reponse_erreur(
            "Le profil Appretruct de ce compte est introuvable.",
            statut=403,
        )

    if role not in DESTINATIONS:
        return reponse_erreur(
            "Le rôle de ce compte n'est pas reconnu.",
            statut=403,
        )

    login(request, utilisateur)

    return JsonResponse({
        "message": "Connexion réussie.",
        "email": utilisateur.email,
        "role": role,
        "destination": DESTINATIONS[role],
    })


# ==========================================================
# 5. PROFIL UTILISATEUR : AFFICHAGE
# ==========================================================

@require_GET
def profil_utilisateur_api(request):
    if not request.user.is_authenticated:
        return reponse_erreur(
            "Tu dois te connecter pour consulter ton profil.",
            statut=401,
        )

    profil_compte = obtenir_profil_compte(
        request, "utilisateur"
    )

    if profil_compte is None:
        return reponse_erreur(
            "Accès réservé aux candidats.",
            statut=403,
        )

    candidat = ProfilCandidat.objects.filter(
        compte=profil_compte
    ).first()

    if candidat is None:
        return reponse_erreur(
            "Le profil du candidat est introuvable.",
            statut=404,
        )

    return JsonResponse({
        "nom": candidat.nom,
        "prenom": candidat.prenom,
        "email": request.user.email,
        "telephone": candidat.telephone or "",
        "date_naissance": (
            candidat.date_naissance.isoformat()
            if candidat.date_naissance
            else ""
        ),
        "ville": candidat.ville or "",
        "cv": candidat.cv.url if candidat.cv else "",
    })


# ==========================================================
# 6. MODIFICATION DU PROFIL UTILISATEUR
# ==========================================================

@require_POST
def modifier_profil_utilisateur_api(request):
    if not request.user.is_authenticated:
        return reponse_erreur(
            "Tu dois te connecter pour modifier ton profil.",
            statut=401,
        )

    profil_compte = obtenir_profil_compte(
        request, "utilisateur"
    )

    if profil_compte is None:
        return reponse_erreur(
            "Accès réservé aux candidats.",
            statut=403,
        )

    candidat = ProfilCandidat.objects.filter(
        compte=profil_compte
    ).first()

    if candidat is None:
        return reponse_erreur(
            "Le profil du candidat est introuvable.",
            statut=404,
        )

    donnees, fichiers = lire_donnees_requete(request)

    if donnees is None:
        return reponse_erreur(
            "Impossible de lire les informations envoyées."
        )

    candidat.nom = (
        lire_texte(donnees, "nom") or candidat.nom
    )

    candidat.prenom = (
        lire_texte(donnees, "prenom") or candidat.prenom
    )

    candidat.telephone = lire_texte(
        donnees, "telephone"
    )

    candidat.ville = lire_texte(
        donnees, "ville"
    )

    date_naissance = lire_texte(
        donnees, "date_naissance"
    )

    if date_naissance:
        date_convertie = parse_date(date_naissance)

        if date_convertie is None:
            return reponse_erreur(
                "La date de naissance est invalide."
            )

        candidat.date_naissance = date_convertie

    cv = fichiers.get("cv")

    if cv:
        try:
            verifier_fichier(cv)
        except ValidationError as erreur:
            return reponse_erreur(
                "Le CV fourni n'est pas valide.",
                details=erreur.messages,
            )

        candidat.cv = cv

    try:
        candidat.full_clean()
        candidat.save()

    except ValidationError as erreur:
        details = (
            getattr(erreur, "message_dict", None)
            or erreur.messages
        )

        return reponse_erreur(
            "Impossible d'enregistrer le profil.",
            details=details,
        )

    return JsonResponse({
        "message": "Profil mis à jour avec succès.",
        "nom": candidat.nom,
        "prenom": candidat.prenom,
        "email": request.user.email,
        "telephone": candidat.telephone or "",
        "date_naissance": (
            candidat.date_naissance.isoformat()
            if candidat.date_naissance
            else ""
        ),
        "ville": candidat.ville or "",
        "cv": candidat.cv.url if candidat.cv else "",
    })


# ==========================================================
# 7. PROFIL ENTREPRISE : AFFICHAGE
# ==========================================================

@require_GET
def profil_entreprise_api(request):
    if not request.user.is_authenticated:
        return reponse_erreur(
            "Tu dois te connecter pour consulter le profil.",
            statut=401,
        )

    profil_compte = obtenir_profil_compte(
        request, "entreprise"
    )

    if profil_compte is None:
        return reponse_erreur(
            "Accès réservé aux entreprises.",
            statut=403,
        )

    entreprise = ProfilEntreprise.objects.filter(
        compte=profil_compte
    ).first()

    if entreprise is None:
        return reponse_erreur(
            "Le profil de l'entreprise est introuvable.",
            statut=404,
        )

    return JsonResponse({
        "nom_entreprise": entreprise.nom_entreprise,
        "email": request.user.email,
        "domaine_activite": entreprise.domaine_activite,
        "secteur_activite": entreprise.secteur_activite or "",
        "type_entreprise": entreprise.type_entreprise,
        "site_web": entreprise.site_web or "",
        "telephone": entreprise.telephone or "",
        "ville": entreprise.ville or "",
        "adresse": entreprise.adresse or "",
        "description": entreprise.description or "",
        "document_presentation": (
            entreprise.document_presentation.url
            if entreprise.document_presentation
            else ""
        ),
    })


# ==========================================================
# 8. MODIFICATION DU PROFIL ENTREPRISE
# ==========================================================

@require_POST
def modifier_profil_entreprise_api(request):
    if not request.user.is_authenticated:
        return reponse_erreur(
            "Tu dois te connecter pour modifier le profil.",
            statut=401,
        )

    profil_compte = obtenir_profil_compte(
        request, "entreprise"
    )

    if profil_compte is None:
        return reponse_erreur(
            "Accès réservé aux entreprises.",
            statut=403,
        )

    entreprise = ProfilEntreprise.objects.filter(
        compte=profil_compte
    ).first()

    if entreprise is None:
        return reponse_erreur(
            "Le profil de l'entreprise est introuvable.",
            statut=404,
        )

    donnees, fichiers = lire_donnees_requete(request)

    if donnees is None:
        return reponse_erreur(
            "Impossible de lire les informations envoyées."
        )

    champs_autorises = [
        "nom_entreprise",
        "domaine_activite",
        "secteur_activite",
        "type_entreprise",
        "site_web",
        "telephone",
        "ville",
        "adresse",
        "description",
        "effectif",
    ]

    for champ in champs_autorises:
        if champ in donnees:
            setattr(
                entreprise,
                champ,
                lire_texte(donnees, champ),
            )

    document = fichiers.get("document_presentation")

    if document:
        try:
            verifier_fichier(document)
        except ValidationError as erreur:
            return reponse_erreur(
                "Le document fourni n'est pas valide.",
                details=erreur.messages,
            )

        entreprise.document_presentation = document

    try:
        entreprise.full_clean()
        entreprise.save()

    except ValidationError as erreur:
        details = (
            getattr(erreur, "message_dict", None)
            or erreur.messages
        )

        return reponse_erreur(
            "Impossible d'enregistrer le profil de l'entreprise.",
            details=details,
        )

    return JsonResponse({
        "message": "Profil de l'entreprise mis à jour.",
        "nom_entreprise": entreprise.nom_entreprise,
        "email": request.user.email,
        "domaine_activite": entreprise.domaine_activite,
        "secteur_activite": entreprise.secteur_activite or "",
        "type_entreprise": entreprise.type_entreprise,
        "site_web": entreprise.site_web or "",
        "telephone": entreprise.telephone or "",
        "ville": entreprise.ville or "",
        "adresse": entreprise.adresse or "",
        "description": entreprise.description or "",
        "document_presentation": (
            entreprise.document_presentation.url
            if entreprise.document_presentation
            else ""
        ),
    })


# ==========================================================
# 9. TABLEAU DE BORD ADMINISTRATEUR : LISTE DES COMPTES
# ==========================================================

@require_GET
def liste_comptes_administrateur_api(request):
    if not request.user.is_authenticated:
        return reponse_erreur(
            "Tu dois te connecter pour consulter les comptes.",
            statut=401,
        )

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

    profils = (
        ProfilCompte.objects
        .select_related("utilisateur")
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

        if profil.type_compte == "utilisateur":
            candidat = ProfilCandidat.objects.filter(
                compte=profil
            ).first()

            if candidat:
                compte.update({
                    "nom_affichage": (
                        f"{candidat.prenom} {candidat.nom}"
                    ),
                    "telephone": candidat.telephone or "",
                    "ville": candidat.ville or "",
                    "domaine": candidat.domaine or "",
                    "document_disponible": bool(candidat.cv),
                })

        elif profil.type_compte == "entreprise":
            entreprise = ProfilEntreprise.objects.filter(
                compte=profil
            ).first()

            if entreprise:
                compte.update({
                    "nom_affichage": entreprise.nom_entreprise,
                    "telephone": entreprise.telephone or "",
                    "ville": entreprise.ville or "",
                    "domaine": entreprise.domaine_activite or "",
                    "document_disponible": bool(
                        entreprise.document_presentation
                    ),
                })

        elif profil.type_compte == "administrateur":
            administrateur = Administrateur.objects.filter(
                compte=profil
            ).first()

            if administrateur:
                compte.update({
                    "nom_affichage": (
                        f"{administrateur.prenom} "
                        f"{administrateur.nom}"
                    ),
                    "telephone": administrateur.telephone or "",
                })

        comptes.append(compte)

    return JsonResponse({
        "total": len(comptes),
        "comptes": comptes,
    })


# ==========================================================
# 10. DÉCONNEXION
# ==========================================================

@require_POST
def deconnexion_api(request):
    logout(request)

    return JsonResponse({
        "message": "Déconnexion réussie.",
        "destination": "/connexion/",
    })
