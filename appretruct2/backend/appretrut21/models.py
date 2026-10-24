
from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.db import models


# ==========================================================
# 1. PROFIL DU COMPTE
# ==========================================================

class ProfilCompte(models.Model):

    class TypeCompte(models.TextChoices):
        UTILISATEUR = "utilisateur", "Utilisateur"
        ENTREPRISE = "entreprise", "Entreprise"
        ADMINISTRATEUR = "administrateur", "Administrateur"

    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil_appretruct",
    )

    type_compte = models.CharField(
        max_length=20,
        choices=TypeCompte.choices,
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil de compte"
        verbose_name_plural = "Profils de comptes"

    def __str__(self):
        identifiant = (
            self.utilisateur.email
            or self.utilisateur.get_username()
        )
        return f"{identifiant} - {self.get_type_compte_display()}"


# ==========================================================
# 2. PROFIL DU CANDIDAT
# ==========================================================

class ProfilCandidat(models.Model):

    compte = models.OneToOneField(
        ProfilCompte,
        on_delete=models.CASCADE,
        related_name="candidat",
    )

    # Informations personnelles
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)

    telephone = models.CharField(
        max_length=30,
        blank=True,
    )

    date_naissance = models.DateField(
        null=True,
        blank=True,
    )

    ville = models.CharField(
        max_length=100,
        blank=True,
    )

    # Informations professionnelles
    domaine = models.CharField(
        max_length=150,
        blank=True,
    )

    titre_professionnel = models.CharField(
        max_length=150,
        blank=True,
    )

    annees_experience = models.PositiveSmallIntegerField(
        default=0,
    )

    experience = models.TextField(
        blank=True,
        help_text="Décrivez vos expériences professionnelles.",
    )

    competences = models.TextField(
        blank=True,
        help_text="Décrivez vos compétences professionnelles.",
    )

    presentation = models.TextField(
        blank=True,
        help_text="Présentez votre profil et vos objectifs.",
    )

    # CV du candidat
    cv = models.FileField(
        upload_to="cvs/",
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "doc", "docx"],
                message="Formats autorisés : PDF, DOC et DOCX.",
            )
        ],
    )

    # Liens professionnels facultatifs
    linkedin = models.URLField(blank=True)
    portfolio = models.URLField(blank=True)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil candidat"
        verbose_name_plural = "Profils candidats"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.prenom} {self.nom}"


# ==========================================================
# 3. PROFIL DE L'ENTREPRISE
# ==========================================================

class ProfilEntreprise(models.Model):

    class TypeEntreprise(models.TextChoices):
        PRIVEE = "privee", "Entreprise privée"
        PUBLIQUE = "publique", "Entreprise publique"
        STARTUP = "startup", "Startup"
        ONG = "ong", "ONG ou association"
        AUTRE = "autre", "Autre"

    compte = models.OneToOneField(
        ProfilCompte,
        on_delete=models.CASCADE,
        related_name="entreprise",
    )

    # Informations principales
    nom_entreprise = models.CharField(max_length=200)

    domaine_activite = models.CharField(max_length=150)

    secteur_activite = models.CharField(
        max_length=150,
        blank=True,
    )

    type_entreprise = models.CharField(
        max_length=20,
        choices=TypeEntreprise.choices,
        default=TypeEntreprise.PRIVEE,
    )

    site_web = models.URLField(blank=True)

    telephone = models.CharField(
        max_length=30,
        blank=True,
    )

    # Localisation
    ville = models.CharField(max_length=100, blank=True)
    adresse = models.CharField(max_length=255, blank=True)

    latitude = models.FloatField(
        null=True,
        blank=True,
    )

    longitude = models.FloatField(
        null=True,
        blank=True,
    )

    # Présentation de l'entreprise
    description = models.TextField(
        blank=True,
        help_text="Présentez les activités et les services de l'entreprise.",
    )

    document_presentation = models.FileField(
        upload_to="documents_entreprises/",
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["pdf", "doc", "docx"],
                message="Formats autorisés : PDF, DOC et DOCX.",
            )
        ],
    )

    effectif = models.CharField(
        max_length=50,
        blank=True,
    )

    annee_creation = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
    )

    est_verifiee = models.BooleanField(default=False)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil entreprise"
        verbose_name_plural = "Profils entreprises"
        ordering = ["nom_entreprise"]

    def clean(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValidationError(
                "La latitude et la longitude doivent être renseignées ensemble."
            )

    def __str__(self):
        return self.nom_entreprise


# ==========================================================
# 4. PROFIL DE L'ADMINISTRATEUR
# ==========================================================

class Administrateur(models.Model):

    compte = models.OneToOneField(
        ProfilCompte,
        on_delete=models.CASCADE,
        related_name="administrateur",
    )

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)

    telephone = models.CharField(
        max_length=30,
        blank=True,
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Administrateur"
        verbose_name_plural = "Administrateurs"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.prenom} {self.nom}"

