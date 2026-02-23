# 🛒 Courses Malin

> Gérez vos listes de courses, suivez votre budget et organisez vos achats — simplement, depuis n'importe quel appareil.

🔗 **Application en ligne** : [liste-coursesv2.netlify.app](https://liste-coursesv2.netlify.app/)

---

## 📸 Aperçu

| Accueil & Budget | Mes Listes | Réglages |
|:---:|:---:|:---:|
| Suivi en temps réel | Gestion multi-listes | Thèmes & sons |

---

## ✨ Fonctionnalités

### 🛒 Gestion des articles
- Ajout rapide via suggestions (Pain, Lait, Œufs…) ou saisie libre
- **Scan de code-barres** : ajoutez un article en flashant son code-barres (via l’appareil photo) – les données (nom, catégorie, marque) sont automatiquement récupérées grâce à l’API **Open Food Facts**
- **Mode scan multiple** : activez le mode multi-scan pour enchaîner les scans sans fermer la caméra ; à chaque scan, vous pouvez :
  - **Ajouter** l’article à la liste
  - **Ignorer** le scan
  - **Arrêter** le scan
- **Détection automatique des doublons** : si un article déjà présent est scanné ou saisi, une proposition d’augmentation de la quantité est faite
- Modification du nom, de la quantité (+/-), du prix, de la catégorie et d'une note
- Regroupement automatique par **catégorie** (Fruits & Légumes, Boulangerie, Hygiène…)
- Case à cocher pour marquer un article comme acheté (texte barré)
- Édition du prix en ligne directement dans la liste
- Suppression avec possibilité d'**annulation instantanée**
- **Recherche incrémentale** : filtrage en temps réel à la frappe

### 💰 Suivi du budget
- Définissez un budget total modifiable à tout moment
- Calcul automatique du **montant dépensé** et du **restant**
- Barre de progression visuelle (vert → orange → rouge)
- **Alerte de dépassement** avec le montant excédentaire affiché

### 🔔 Alerte sonore
- Activation / désactivation de l'alerte budgétaire
- Choix parmi **7 sons** (AlarmA à AlarmG)
- Bouton Stop pour interrompre le son
- Fallback automatique via Web Audio API si les fichiers sont indisponibles

### 📋 Listes multiples
- Créez autant de listes que souhaité (Supermarché, Marché, Pharmacie…)
- Chaque liste possède un **emoji** et une **couleur** personnalisables
- Barre de progression par liste (articles cochés / total)
- Renommer ou supprimer une liste en un tap
- Navigation rapide entre les listes

### 🗺️ Carte du magasin
- Associez une **photo de la carte du magasin** à chaque liste (prise via l’appareil photo ou depuis la galerie)
- **Éditeur d’image intégré** : recadrez, faites pivoter ou retournez l’image avant de l’enregistrer
- Visualisez la carte directement dans l’accueil, avec options pour voir, changer ou supprimer l’image
- Idéal pour ne pas oublier le plan du magasin lors de vos courses

### 📤 Export / Import des listes (CSV)
- **Exportez une ou plusieurs listes** au format CSV (compatible avec Excel, Numbers, Google Sheets)
- Le fichier contient : nom de la liste, article, quantité, prix, catégorie, note, état coché
- **Nom de fichier intelligent** : si une seule liste est exportée, le fichier prend le nom de cette liste (ex: `supermarché_2025-02-23.csv`) ; pour plusieurs listes, le nom par défaut est `mes_listes_2025-02-23.csv`
- **Importez un fichier CSV** pour remplacer vos listes existantes par celles du fichier (confirmation avant remplacement)
- Permet de sauvegarder, partager ou modifier vos listes sur ordinateur ou mobile

### 🎨 Personnalisation
- **7 thèmes de couleurs** : Bleu, Vert, Rouge, Violet, Orange, Rose, Or
- **Mode sombre / clair** avec détection automatique possible
- Tous les réglages sont sauvegardés entre les sessions

### 💾 Persistance des données
- Toutes les données sont sauvegardées dans le **localStorage** du navigateur
- Aucune perte après rechargement ou fermeture de l'onglet
- Aucun compte, aucun serveur, aucune connexion requise

### 📱 Design mobile-first & confort d’utilisation
- Interface optimisée pour smartphones et tablettes
- Navigation par **barre d'onglets** fixe en bas d'écran
- Formulaires en **bottom sheet** (glissement vers le haut)
- Fermeture des panneaux par swipe bas ou touche Échap
- **Logo cliquable** : affiche le logo en plein écran d’un simple tap
- **Bouton retour** dans les vues secondaires pour revenir à l’accueil
- **État vide intelligent** : cliquer sur l’écran “liste vide” redirige vers la création de liste si aucune n’existe, ou ouvre l’ajout d’article si une liste est déjà présente
- Compatible PWA (installable sur l'écran d'accueil)

---

## 🗂 Architecture du projet
/
├── index.html # Page principale
├── README.md
├── .gitignore
│
└── assets/
├── css/
│ └── style.css # Styles (thèmes, composants, responsive)
├── js/
│ └── script.js # Logique complète de l'application
├── sound/
│ ├── AlarmA.mp3 # Sons d'alerte (A à G)
│ └── ...
├── images/ # Illustrations et logos
├── icon/
│ ├── favicon.ico
│ ├── favicon-16x16.png
│ ├── favicon-32x32.png
│ └── apple-touch-icon.png
└── manifest/
└── site.webmanifest # Manifest PWA

text

---

## 🚀 Installation & utilisation locale

### Prérequis
Aucun — l'application fonctionne entièrement côté client, sans serveur ni dépendance.

### Étapes

1. **Clonez** le dépôt :
   ```bash
   git clone https://github.com/Septieme7/Liste-Courses-V2.git
   cd Liste-de-courses
Ouvrez index.html dans un navigateur moderne (Chrome, Firefox, Edge, Safari) :

bash
# Ou simplement double-cliquez sur index.html
open index.html
C'est tout. Aucune installation, aucun npm install.

💡 Pour bénéficier des sons d'alerte, placez vos fichiers AlarmA.mp3 à AlarmG.mp3 dans assets/sound/.

🛠 Technologies utilisées
Technologie	Rôle
HTML5 sémantique	Structure (sections, nav, dialog, aria-*)
CSS3	Variables CSS, Flexbox, Grid, animations, media queries
JavaScript ES6+	Logique métier, DOM, événements
localStorage	Persistance des données côté client
Web Audio API	Fallback son si MP3 indisponible
Open Food Facts API	Récupération des informations produits par code‑barres
html5-qrcode	Scanner de code‑barres léger et performant
Cropper.js	Édition d’image (recadrage, rotation)
PWA (manifest)	Installable sur l'écran d'accueil
Netlify	Hébergement et déploiement continu
🎯 Guide d'utilisation rapide
Créer une liste
Onglet Mes Listes → bouton Nouvelle

Saisissez un nom, choisissez un emoji et une couleur

Appuyez sur Créer la liste

Ajouter un article
Manuellement : bouton + (en bas à droite ou en haut à droite) → remplissez le formulaire

Par scan : bouton Scanner dans le formulaire d’ajout → scannez le code‑barres

Mode scan multiple : activez le toggle dans le formulaire, puis scannez plusieurs articles ; après chaque scan, choisissez Ajouter, Ignorer ou Arrêter

Suivre son budget
Modifiez le budget total en haut de l'accueil

Renseignez les prix de vos articles

La barre de progression et les montants se mettent à jour automatiquement

Ajouter une carte de magasin à une liste
Dans Mes Listes, cliquez sur l’icône 📷 de la liste souhaitée

Prenez une photo ou sélectionnez une image depuis votre galerie

Éditez l’image (recadrage, rotation, retournement) puis validez

La carte apparaîtra dans l’accueil de cette liste

Exporter / Importer des listes
Exporter : dans Mes Listes, cliquez sur 📤 Exporter les listes → sélectionnez les listes à exporter, puis confirmez → un fichier CSV est téléchargé

Importer : dans Mes Listes, cliquez sur 📥 Importer un fichier, sélectionnez un fichier CSV au même format → les listes existantes sont remplacées (confirmation)

Cocher un article
Appuyez sur le cercle à gauche de l'article pour le marquer comme acheté

Changer de thème
Onglet Réglages

Choisissez une couleur principale et/ou activez le mode sombre

♿ Accessibilité
Attributs aria-label, aria-live, aria-checked, aria-current sur tous les éléments interactifs

Navigation au clavier complète (Tab, Entrée, Échap)

Rôles sémantiques (role="switch", role="dialog", role="progressbar")

Contrastes conformes aux recommandations WCAG

📄 Licence
Ce projet est libre d'utilisation.

👤 Auteur
Seven7 — Projet personnel.

💬 Des suggestions ? Ouvrez une issue ou proposez une Pull Request !