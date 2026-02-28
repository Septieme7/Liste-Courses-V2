# 🛒 Courses Malin

> Gérez vos listes de courses, suivez votre budget et organisez vos achats — simplement, depuis n'importe quel appareil.

🔗 **Application en ligne** : [liste-coursesv2.netlify.app](https://liste-coursesv2.netlify.app/)

---

## 📸 Aperçu

| Accueil & Budget | Mes Listes | Réglages |
|:---:|:---:|:---:|
| Suivi en temps réel | Gestion multi-listes | Thèmes, sons, langues, taille d'affichage |

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
- **Unités de mesure** : choisissez l'unité (kg, L, pièce, paquet…) et saisissez un prix au kilo pour faciliter les comparaisons
- **Glisser‑déposer** : réorganisez vos articles en les déplaçant par leur nom ; le changement de catégorie est automatique lors du déplacement
- **Saisie vocale** : ajoutez des articles en parlant (Web Speech API) – vous pouvez dicter plusieurs articles séparés par des virgules
- Regroupement automatique par **catégorie** (Fruits & Légumes, Boulangerie, Hygiène…) – les catégories vides disparaissent automatiquement
- **Catégories personnalisées** : créez, modifiez ou supprimez vos propres catégories avec un emoji et une couleur
- Case à cocher pour marquer un article comme acheté (texte barré)
- Édition du prix en ligne directement dans la liste
- Suppression avec possibilité d'**annulation instantanée**
- **Recherche incrémentale** : filtrage en temps réel à la frappe

### 💰 Suivi du budget
- Définissez un budget total modifiable à tout moment
- Calcul automatique du **montant dépensé** et du **restant** (le libellé devient "Dépassement" si négatif)
- Barre de progression visuelle (vert → orange → rouge)
- **Alertes personnalisées** : choisissez des seuils (50 %, 80 %, 100 %) avec notification sonore
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
- **Importer une autre liste** dans la liste active (fusion avec gestion des doublons et option "Appliquer à tous")
- **Export/Import CSV** : sauvegardez ou restaurez vos listes ; lors de l'import, vous pouvez choisir de remplacer ou fusionner les listes existantes, avec gestion des doublons

### 🗺️ Carte et localisation du magasin
- Associez une **photo de la carte du magasin** à chaque liste (prise via l’appareil photo ou depuis la galerie)
- **Éditeur d’image intégré** : recadrez, faites pivoter ou retournez l’image avant de l’enregistrer
- **Géolocalisation** : enregistrez l'adresse du magasin (via OpenStreetMap) – un bouton **Itinéraire** ouvre Google Maps avec les coordonnées
- Visualisez la carte directement dans l’accueil, avec options pour voir, changer ou supprimer l’image

### 📤 Export / Import des listes (CSV)
- **Exportez une ou plusieurs listes** au format CSV (compatible avec Excel, Numbers, Google Sheets)
- Le fichier contient : nom de la liste, article, quantité, prix, catégorie, note, état coché
- **Nom de fichier intelligent** : si une seule liste est exportée, le fichier prend le nom de cette liste (ex: `supermarché_2025-02-23.csv`) ; pour plusieurs listes, le nom par défaut est `mes_listes_2025-02-23.csv`
- **Importez un fichier CSV** : vous pouvez remplacer vos listes existantes ou les fusionner ; en cas de doublon, une boîte de dialogue vous propose de fusionner ou d'ignorer, avec option "Appliquer à tous"
- Permet de sauvegarder, partager ou modifier vos listes sur ordinateur ou mobile

### 📱 Partage amélioré
- **Partagez votre liste** sous forme de texte lisible (prêt à être collé dans un message) via l'API Web Share
- Si le partage n'est pas disponible, le texte est copié dans le presse-papiers
- En dernier recours, un fichier `.txt` est téléchargé
- **Partage en texte depuis Mes Listes** : sélectionnez une ou plusieurs listes et générez un fichier `.txt` contenant leur contenu formaté

### 🎨 Personnalisation
- **7 thèmes de couleurs** : Bleu, Vert, Rouge, Violet, Orange, Rose, Or
- **Mode sombre / clair** avec détection automatique possible
- **Choix de la langue** : 15 langues disponibles (français, anglais, espagnol, allemand, italien, portugais, russe, chinois, japonais, arabe, hindi, bengali, pendjabi, javanais, turc, vietnamien) – toutes les interfaces, suggestions rapides et catégories sont traduites
- **Ajustement de la taille d'affichage** : 5 niveaux (microscopique, petit, moyen, grand, big strong) pour adapter l'interface à vos préférences visuelles
- **Gestion des catégories personnalisées** : créez vos propres catégories avec emoji et couleur
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
│ ├── style.css # Styles principaux
│ └── style2.css # Styles additionnels (unités, géolocalisation…)
├── js/
│ ├── script.js # Logique principale
│ ├── i18n.js # Gestion des langues
│ ├── units.js # Gestion des unités
│ ├── dragdrop.js # Glisser‑déposer
│ ├── speech.js # Reconnaissance vocale
│ └── geolocation.js # Géolocalisation
├── lang/
│ ├── fr.json
│ ├── en.json
│ ├── es.json
│ ├── de.json
│ ├── it.json
│ ├── pt.json
│ ├── ru.json
│ ├── zh.json
│ ├── ja.json
│ ├── ar.json
│ ├── hi.json
│ ├── bn.json
│ ├── pa.json
│ ├── jv.json
│ ├── tr.json
│ └── vi.json
├── sound/
│ ├── AlarmA.mp3 # Sons d'alerte (A à G)
│ └── ...
├── images/ # Illustrations et logos
├── icon/ # Icônes pour PWA
└── manifest/ # Manifest PWA

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
open index.html   # ou double-cliquez sur le fichier
C'est tout. Aucune installation, aucun npm install.

💡 Pour bénéficier des sons d'alerte, placez vos fichiers AlarmA.mp3 à AlarmG.mp3 dans assets/sound/.

### 🛠 Technologies utilisées
Technologie	Rôle
HTML5 sémantique	Structure (sections, nav, dialog, aria-*)
CSS3	Variables CSS, Flexbox, Grid, animations, media queries, échelle de zoom utilisateur
JavaScript ES6+	Logique métier, DOM, événements
localStorage	Persistance des données côté client
Web Audio API	Fallback son si MP3 indisponible
Open Food Facts API	Récupération des informations produits par code‑barres
html5-qrcode	Scanner de code‑barres léger et performant
Cropper.js	Édition d’image (recadrage, rotation)
SortableJS	Glisser‑déposer des articles
Web Speech API	Reconnaissance vocale pour ajout d'articles
Nominatim (OpenStreetMap)	Géocodage inverse pour localiser le magasin
i18n	Système maison de traduction (JSON)
PWA (manifest)	Installable sur l'écran d'accueil
Netlify	Hébergement et déploiement continu

### 🎯 Guide d'utilisation rapide
Créer une liste

Onglet Mes Listes → bouton Nouvelle

Saisissez un nom, choisissez un emoji et une couleur

Appuyez sur Créer la liste

Ajouter un article
Manuellement : bouton + (en bas à droite ou en haut à droite) → remplissez le formulaire (nom, quantité, prix, unité, catégorie…)

Par scan : bouton 📷 Scanner dans le formulaire → scannez le code‑barres

Par la voix : bouton 🎤 dans le formulaire → dictez le nom de l'article (vous pouvez dicter plusieurs articles séparés par des virgules)

Mode scan multiple : activez le toggle dans le formulaire, puis scannez plusieurs articles ; après chaque scan, choisissez Ajouter, Ignorer ou Arrêter

Gérer les catégories personnalisées
Dans le formulaire d'ajout d'article, cliquez sur ⚙️ à côté du sélecteur de catégorie

Vous pouvez créer, modifier ou supprimer vos propres catégories (nom, emoji, couleur)

Réorganiser les articles
Appuyez longuement sur le nom d'un article et glissez‑le pour changer son ordre ou le déplacer dans une autre catégorie (la catégorie est automatiquement mise à jour)

Suivre son budget
Modifiez le budget total en haut de l'accueil

Renseignez les prix de vos articles

La barre de progression et les montants se mettent à jour automatiquement

Dans les réglages, activez des seuils d'alerte (50 %, 80 %, 100 %)

Ajouter une carte / localisation du magasin
Dans Mes Listes, cliquez sur l’icône 📷 de la liste souhaitée

Prenez une photo ou sélectionnez une image depuis votre galerie

Éditez l’image (recadrage, rotation, retournement) puis validez

Pour ajouter la position, cliquez sur 📍 Localiser dans la carte (autorisez la géolocalisation)

La carte et la localisation apparaîtront dans l’accueil de cette liste

Utilisez le bouton 🧭 Itinéraire pour ouvrir Google Maps avec l'adresse enregistrée

Exporter / Importer des listes
Exporter : dans Mes Listes, cliquez sur 📤 Exporter les listes → sélectionnez les listes à exporter, puis confirmez → un fichier CSV est téléchargé

Importer : dans Mes Listes, cliquez sur 📥 Importer un fichier, sélectionnez un fichier CSV au même format → vous pouvez remplacer ou fusionner les listes existantes ; en cas de doublon, une boîte de dialogue vous guide

Partager en texte : dans Mes Listes, cliquez sur 📤 Partager en texte → sélectionnez une ou plusieurs listes → un fichier .txt est généré avec leur contenu formaté

Importer une autre liste dans la liste active
Dans l'accueil, cliquez sur l'icône d'import (📥) à côté du nom de la liste

Sélectionnez une ou plusieurs listes sources

En cas de doublon, une boîte de dialogue vous propose de fusionner ou d'ignorer, avec option "Appliquer à tous"

Partager une liste
Dans l'accueil, cliquez sur l'icône de partage à côté du nom de la liste

La liste est copiée sous forme de texte lisible (prêt à être collé) ; si votre appareil le permet, une boîte de partage native s'ouvre

Changer la langue, le thème ou la taille d'affichage
Onglet Réglages

Choisissez la langue, le mode sombre/clair, la couleur principale, et la taille d'affichage parmi 5 niveaux

♿ Accessibilité
Attributs aria-label, aria-live, aria-checked, aria-current sur tous les éléments interactifs

Navigation au clavier complète (Tab, Entrée, Échap)

Rôles sémantiques (role="switch", role="dialog", role="progressbar")

Contrastes conformes aux recommandations WCAG

Ajustement de la taille du texte par l'utilisateur

📄 Licence
Copyright
👤 Auteur : Seven7.

💬 Des suggestions ? Ouvrez une issue ou proposez une Pull Request !