# 🛒 Courses Malin

> Gérez vos listes de courses, suivez votre budget et organisez vos achats — simplement, depuis n'importe quel appareil.

🔗 **Application en ligne** : [liste-courses7.netlify.app](https://liste-courses7.netlify.app/)

---

## 📸 Aperçu

| Accueil & Budget | Mes Listes | Réglages |
|:---:|:---:|:---:|
| Suivi en temps réel | Gestion multi-listes | Thèmes & sons |

---

## ✨ Fonctionnalités

### 🛒 Gestion des articles
- Ajout rapide via suggestions (Pain, Lait, Œufs…) ou saisie libre
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

### 🎨 Personnalisation
- **7 thèmes de couleurs** : Bleu, Vert, Rouge, Violet, Orange, Rose, Or
- **Mode sombre / clair** avec détection automatique possible
- Tous les réglages sont sauvegardés entre les sessions

### 💾 Persistance des données
- Toutes les données sont sauvegardées dans le **localStorage** du navigateur
- Aucune perte après rechargement ou fermeture de l'onglet
- Aucun compte, aucun serveur, aucune connexion requise

### 📱 Design mobile-first
- Interface optimisée pour smartphones et tablettes
- Navigation par **barre d'onglets** fixe en bas d'écran
- Formulaires en **bottom sheet** (glissement vers le haut)
- Fermeture des panneaux par swipe bas ou touche Échap
- Compatible PWA (installable sur l'écran d'accueil)

---

## 🗂 Architecture du projet

```
/
├── index.html                   # Page principale
├── README.md
├── .gitignore
│
└── assets/
    ├── css/
    │   └── style.css            # Styles (thèmes, composants, responsive)
    ├── js/
    │   └── script.js            # Logique complète de l'application
    ├── sound/
    │   ├── AlarmA.mp3           # Sons d'alerte (A à G)
    │   └── ...
    ├── images/                  # Illustrations et logos
    ├── icon/
    │   ├── favicon.ico
    │   ├── favicon-16x16.png
    │   ├── favicon-32x32.png
    │   └── apple-touch-icon.png
    └── manifest/
        └── site.webmanifest     # Manifest PWA
```

---

## 🚀 Installation & utilisation locale

### Prérequis
Aucun — l'application fonctionne entièrement côté client, sans serveur ni dépendance.

### Étapes

1. **Clonez** le dépôt :
   ```bash
   git clone https://github.com/Septieme7/Liste-Courses-V2.git
   cd Liste-de-courses
   ```

2. **Ouvrez** `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari) :
   ```bash
   # Ou simplement double-cliquez sur index.html
   open index.html
   ```

3. **C'est tout.** Aucune installation, aucun `npm install`.

> 💡 Pour bénéficier des sons d'alerte, placez vos fichiers `AlarmA.mp3` à `AlarmG.mp3` dans `assets/sound/`.

---

## 🛠 Technologies utilisées

| Technologie | Rôle |
|---|---|
| **HTML5** sémantique | Structure (sections, nav, dialog, aria-*) |
| **CSS3** | Variables CSS, Flexbox, Grid, animations, media queries |
| **JavaScript ES6+** | Logique métier, DOM, événements |
| **localStorage** | Persistance des données côté client |
| **Web Audio API** | Fallback son si MP3 indisponible |
| **PWA** (manifest) | Installable sur l'écran d'accueil |
| **Netlify** | Hébergement et déploiement continu |

---

## 🎯 Guide d'utilisation rapide

### Créer une liste
1. Onglet **Mes Listes** → bouton **Nouvelle**
2. Saisissez un nom, choisissez un emoji et une couleur
3. Appuyez sur **Créer la liste**

### Ajouter un article
1. Depuis l'accueil, appuyez sur le bouton **+** (en bas à droite ou en haut à droite)
2. Utilisez une **suggestion rapide** ou saisissez le nom manuellement
3. Ajustez la quantité, le prix, la catégorie et une note optionnelle
4. Appuyez sur **Ajouter**

### Suivre son budget
1. Modifiez le **budget total** en haut de l'accueil
2. Renseignez les prix de vos articles
3. La barre de progression et les montants se mettent à jour automatiquement

### Cocher un article
- Appuyez sur le **cercle** à gauche de l'article pour le marquer comme acheté

### Changer de thème
1. Onglet **Réglages**
2. Choisissez une couleur principale et/ou activez le **mode sombre**

---

## ♿ Accessibilité

- Attributs `aria-label`, `aria-live`, `aria-checked`, `aria-current` sur tous les éléments interactifs
- Navigation au clavier complète (Tab, Entrée, Échap)
- Rôles sémantiques (`role="switch"`, `role="dialog"`, `role="progressbar"`)
- Contrastes conformes aux recommandations WCAG

---

## 📄 Licence

Ce projet est libre d'utilisation.

---

## 👤 Auteur

**Seven7** — Projet personnel.

> 💬 *Des suggestions ? Ouvrez une [issue](https://github.com/Septieme7/Liste-Courses-V2/issues) ou proposez une Pull Request !*