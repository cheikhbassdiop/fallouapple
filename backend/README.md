# FalouApple — Backend PHP / MySQL

## Prérequis
- PHP 8.1+ avec `pdo_mysql` et sessions activés
- MySQL 8+ ou MariaDB compatible
- Apache/Nginx avec HTTPS en production

## Installation
1. Placez le dossier `FalouApple` dans le répertoire public de votre serveur (ex. `htdocs/FalouApple`).
2. Créez une base MySQL, puis importez `backend/schema.sql` dans phpMyAdmin.
3. Copiez `backend/config.example.php` vers `backend/config.php`, puis renseignez l'hôte, la base, l'utilisateur et le mot de passe MySQL.
4. Ouvrez `backend/create_admin.php` une seule fois en POST JSON avec `name`, `email` et `password` (12 caractères minimum). Exemple :

```bash
curl -X POST https://votre-domaine/FalouApple/backend/create_admin.php \
  -H 'Content-Type: application/json' \
  -d '{"name":"Administrateur","email":"admin@exemple.com","password":"VotreMotDePasseSolide"}'
```

5. Supprimez immédiatement `backend/create_admin.php` du serveur après création du compte.
6. Ouvrez `https://votre-domaine/FalouApple/` et connectez-vous avec l'adresse e-mail et le mot de passe créés.

## Synchronisation
Après connexion, l'application charge les données depuis MySQL (`backend/api/state.php`). Les enregistrements sont synchronisés dans la table `app_state`. Les appareils doivent utiliser la même URL d'application et se connecter avec un compte autorisé.

## Rôles
- `admin` : consultation et modification, y compris les articles.
- `manager` : consultation et modification des opérations.
- `seller` : lecture seule dans cette version.

## Sécurité à respecter
- Déployez uniquement derrière HTTPS.
- Gardez `backend/config.php` hors de tout dépôt public.
- Supprimez `create_admin.php` après la création initiale.
- Faites des sauvegardes MySQL quotidiennes.
- Le navigateur doit être servi par le même domaine que l'API pour conserver la session.
- La sauvegarde centralisée est un état JSON unique en MySQL : pour une forte charge ou plusieurs écritures simultanées, une migration vers des tables relationnelles par opération sera préférable.

## Paiements
Wave et Orange Money restent en mode vérification manuelle. Aucun encaissement automatique n'est déclenché par ce backend.
