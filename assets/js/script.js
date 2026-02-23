/* =============================================================
   COURSES MALIN · script.js
   Structure :
     1.  Configuration & constantes
     2.  État global
     3.  Initialisation
     4.  Persistance (localStorage)
     5.  Thème & couleurs
     6.  Navigation (avec gestion du bouton retour)
     7.  Rendu – Vue Accueil
     8.  Rendu – Grille de listes (avec bouton caméra)
     9.  Gestion du budget
    10.  CRUD Articles
    11.  Bottom sheet : Ajouter / Modifier article (multi-ajout)
    12.  Bottom sheet : Créer une liste
    13.  Gestion des listes (CRUD) + carte magasin
    14.  Partage / Export .txt
    15.  Son & alerte budget
    16.  Overlay & sheets
    17.  Modal Logo
    18.  Snackbar
    19.  Utilitaires
    20.  Attachement des écouteurs d'événements
============================================================= */


/* =============================================================
   1. CONFIGURATION & CONSTANTES
============================================================= */

/** Palette de couleurs disponibles */
const COLORS = [
  { n: 'blue',   h: '#3B82F6' },
  { n: 'green',  h: '#10B981' },
  { n: 'red',    h: '#EF4444' },
  { n: 'purple', h: '#8B5CF6' },
  { n: 'orange', h: '#F59E0B' },
  { n: 'pink',   h: '#EC4899' },
  { n: 'gold',   h: '#D97706' },
];

/** Emojis proposés pour les listes */
const EMOJIS = ['🛒', '🏪', '🍎', '🥗', '🏠', '🎉', '💊', '🐾', '🌿', '🍕', '🛍️', '📦'];

/**
 * Suggestions rapides d'articles.
 * Cliquer sur un chip AJOUTE le nom au champ (avec virgule si déjà rempli),
 * permettant de constituer un lot d'articles en un clic.
 */
const QUICK_ITEMS = [
  'Pain', 'Lait', 'Œufs', 'Beurre', 'Fromage', 'Yaourt',
  'Eau', 'Pommes', 'Bananes', 'Poulet', 'Pâtes', 'Riz',
  'Café', 'Jus', 'Farine', 'Sucre', 'Sel', 'Huile',
];

/** Couleur associée à chaque catégorie */
const CAT_COLORS = {
  '🥦 Fruits & Légumes':   '#10B981',
  '🥩 Viandes & Poissons': '#EF4444',
  '🥛 Produits Laitiers':  '#3B82F6',
  '🥖 Boulangerie':        '#F59E0B',
  '🥫 Épicerie':           '#8B5CF6',
  '🧴 Hygiène':            '#EC4899',
  '🧹 Entretien':          '#64748B',
  '🧃 Boissons':           '#06B6D4',
  '🍦 Surgelés':           '#60A5FA',
};

/** Clés localStorage */
const LS_LISTS  = 'cm_lists';
const LS_CFG    = 'cm_cfg';
const LS_BUDGET = 'cm_budget';
const LS_ACTIVE = 'cm_active';


/* =============================================================
   2. ÉTAT GLOBAL
============================================================= */
let lists        = [];      /* Toutes les listes */
let cfg          = {};      /* Configuration */
let budget       = 50;      /* Budget total */
let activeId     = null;    /* ID liste active */
let editItemId   = null;    /* ID article en édition (null = ajout) */
let currentQty   = 1;       /* Quantité courante (stepper) */
let alertPlayed  = false;   /* Alerte son déjà déclenchée */
let openSheetId  = null;    /* Sheet actuellement ouvert */
let snkTimer     = null;    /* Timer snackbar */
let snkCallback  = null;    /* Callback "Annuler" snackbar */
let audioInstance= null;    /* Instance audio en cours */


/* =============================================================
   3. INITIALISATION
============================================================= */

/** Point d'entrée — appelé au DOMContentLoaded */
function init() {
  loadData();
  buildColorGrid('cGrid',  cfg.color || 'blue', onMainColorPick);
  buildColorGrid('lCGrid', null,                onListColorPick);
  buildEmojiChips();
  buildQuickChips();
  applyTheme();
  syncSettingsUI();
  attachListeners();
  renderAll();
}


/* =============================================================
   4. PERSISTANCE (localStorage)
============================================================= */

/** Charge toutes les données */
function loadData() {
  try { lists  = JSON.parse(localStorage.getItem(LS_LISTS))  || []; } catch { lists  = []; }
  try { cfg    = JSON.parse(localStorage.getItem(LS_CFG))    || {}; } catch { cfg    = {}; }

  budget   = parseFloat(localStorage.getItem(LS_BUDGET)) || 50;
  activeId = localStorage.getItem(LS_ACTIVE) || (lists[0]?.id ?? null);

  document.getElementById('budgetIn').value = budget;
}

/** Sauvegarde listes + budget + liste active */
function saveData() {
  localStorage.setItem(LS_LISTS,  JSON.stringify(lists));
  localStorage.setItem(LS_BUDGET, budget);
  localStorage.setItem(LS_ACTIVE, activeId ?? '');
}

/** Sauvegarde la configuration */
function saveConfig() {
  cfg.soundChoice = document.getElementById('soundSel').value;
  localStorage.setItem(LS_CFG, JSON.stringify(cfg));
}

/** Réinitialise tout après confirmation */
function resetAll() {
  if (!confirm('Supprimer TOUTES les données de l\'application ?')) return;
  localStorage.clear();
  location.reload();
}


/* =============================================================
   5. THÈME & COULEURS
============================================================= */

/** Applique data-theme et data-color sur <html> */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', cfg.dark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-color', cfg.color || 'blue');
}

/** Bascule le mode sombre */
function toggleDark() {
  cfg.dark = !cfg.dark;
  const tog = document.getElementById('darkTog');
  tog.classList.toggle('on', cfg.dark);
  tog.setAttribute('aria-checked', cfg.dark);
  saveConfig();
  applyTheme();
}

/** Bascule l'alerte sonore */
function toggleSound() {
  cfg.sound = (cfg.sound === false) ? true : false;
  const tog = document.getElementById('soundTog');
  tog.classList.toggle('on', cfg.sound !== false);
  tog.setAttribute('aria-checked', cfg.sound !== false);
  saveConfig();
}

/**
 * Construit la grille de pastilles de couleur.
 * @param {string}   gridId   - ID du conteneur
 * @param {string}   active   - Couleur sélectionnée
 * @param {Function} callback - Appelé avec le nom de la couleur
 */
function buildColorGrid(gridId, active, callback) {
  const el = document.getElementById(gridId);
  if (!el) return;

  el.innerHTML = COLORS.map(c => `
    <div
      class="csw${active === c.n ? ' on' : ''}"
      style="background:${c.h}"
      data-name="${c.n}"
      role="radio"
      aria-checked="${active === c.n}"
      aria-label="Couleur ${c.n}"
      tabindex="0"
    ></div>
  `).join('');

  el.querySelectorAll('.csw').forEach(dot => {
    dot.addEventListener('click',   () => callback(dot.dataset.name));
    dot.addEventListener('keydown', e  => {
      if (e.key === 'Enter' || e.key === ' ') callback(dot.dataset.name);
    });
  });
}

/** Callback : couleur principale (Réglages) */
function onMainColorPick(name) {
  cfg.color = name;
  saveConfig();
  applyTheme();
  buildColorGrid('cGrid', name, onMainColorPick);
}

/** Callback : couleur d'une liste (sheet) */
function onListColorPick(name) {
  document.getElementById('lColor').value = COLORS.find(c => c.n === name)?.h || '#3B82F6';
  buildColorGrid('lCGrid', name, onListColorPick);
}

/** Synchronise l'UI des réglages avec cfg */
function syncSettingsUI() {
  const soundOn = cfg.sound !== false;
  const darkTog  = document.getElementById('darkTog');
  const soundTog = document.getElementById('soundTog');

  darkTog.classList.toggle('on', !!cfg.dark);
  darkTog.setAttribute('aria-checked', !!cfg.dark);
  soundTog.classList.toggle('on', soundOn);
  soundTog.setAttribute('aria-checked', soundOn);
  document.getElementById('soundSel').value = cfg.soundChoice || 'A';
}


/* =============================================================
   6. NAVIGATION (avec gestion du bouton retour)
============================================================= */

let currentTab = 'home';

/**
 * Navigue vers un onglet.
 * @param {string} tab - 'home' | 'lists' | 'settings'
 */
function goTo(tab) {
  currentTab = tab;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  document.getElementById(`v-${tab}`).classList.add('on');

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('on');
    t.removeAttribute('aria-current');
  });
  const activeTab = document.getElementById(`t-${tab}`);
  activeTab.classList.add('on');
  activeTab.setAttribute('aria-current', 'page');

  // Gestion du bouton retour
  const btnBack = document.getElementById('btnBack');
  if (tab === 'home') {
    btnBack.style.display = 'none';
  } else {
    btnBack.style.display = 'flex';
  }

  // Titre du header et visibilité du bouton Ajouter
  const titles = { home: getActiveName(), lists: 'Mes Listes', settings: 'Réglages' };
  document.getElementById('htitle').textContent = titles[tab];

  const onHome = tab === 'home';
  document.getElementById('fab').style.display    = onHome ? 'flex' : 'none';
  document.getElementById('btnAdd').style.display = onHome ? 'flex' : 'none';

  if (tab === 'lists')    renderLists();
  if (tab === 'home')     renderHome();
  if (tab === 'settings') buildColorGrid('cGrid', cfg.color || 'blue', onMainColorPick);
}

/** Nom de la liste active ou fallback */
function getActiveName() {
  return lists.find(l => l.id === activeId)?.name || 'Mes Courses';
}


/* =============================================================
   7. RENDU – VUE ACCUEIL
============================================================= */

/** Lance tous les rendus */
function renderAll() {
  renderHome();
  renderLists();
}

/**
 * Construit l'affichage des articles de la liste active.
 * Gère la recherche incrémentale et le groupement par catégorie.
 */
function renderHome() {
  const list  = lists.find(l => l.id === activeId);
  const items = list?.items || [];

  /* Indicateur liste active */
  document.getElementById('htitle').textContent    = list?.name || 'Mes Courses';
  document.getElementById('aListName').textContent = list?.name || 'Aucune liste';
  document.getElementById('aListIco').textContent  = list?.emoji || '🛒';

  /* Affichage de la carte du magasin (si existante) */
  const mapContainer = document.getElementById('listMapContainer');
  const mapThumb = document.getElementById('mapThumb');
  if (list && list.mapImage) {
    mapContainer.style.display = 'block';
    mapThumb.src = list.mapImage;
    mapThumb.style.display = 'inline';
  } else {
    mapContainer.style.display = 'none';
  }

  /* Filtrage par recherche */
  const query    = document.getElementById('searchIn').value.toLowerCase().trim();
  const filtered = query
    ? items.filter(i => i.text.toLowerCase().includes(query))
    : items;

  const listEl  = document.getElementById('itemsList');
  const emptyEl = document.getElementById('emptyState');
  const fab     = document.getElementById('fab');

  if (!filtered.length) {
    emptyEl.style.display = 'block';
    listEl.innerHTML      = '';
    fab.classList.add('pulse');
  } else {
    emptyEl.style.display = 'none';
    fab.classList.remove('pulse');

    /* Groupement par catégorie */
    const groups = {};
    filtered.forEach(item => {
      const key = item.cat || '';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let html = '';

    Object.entries(groups).forEach(([cat, groupItems]) => {
      /* En-tête catégorie */
      if (cat) {
        const color = CAT_COLORS[cat] || '#64748B';
        html += `
          <div class="chdr" style="background:${color}18; color:${color}">
            <span>${esc(cat)}</span>
            <span class="chdr-count">${groupItems.length}</span>
          </div>`;
      }

      /* Lignes articles */
      groupItems.forEach(item => {
        const totalPrice = item.price
          ? ' — ' + (item.price * (item.qty || 1)).toFixed(2) + ' €'
          : '';

        html += `
          <li class="irow${item.ck ? ' ckd' : ''}" id="ir-${item.id}">

            <!-- Checkbox ronde — couleur = thème via CSS (.icheck.on) -->
            <button
              class="icheck${item.ck ? ' on' : ''}"
              onclick="toggleCheck('${item.id}')"
              aria-label="${item.ck ? 'Décocher' : 'Cocher'} ${esc(item.text)}"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="white" stroke-width="3.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>

            <!-- Corps : nom + note + prix total -->
            <div class="ibody" onclick="openEditItem('${item.id}')"
                 role="button" tabindex="0"
                 aria-label="Modifier ${esc(item.text)}">
              <div class="itxt">${esc(item.text)}</div>
              ${item.note
                ? `<div class="imeta">${esc(item.note)}</div>`
                : ''}
            </div>

            <!-- Actions : quantité · prix unitaire · supprimer -->
            <div class="iact">
              <button class="qbtn" onclick="adjustQty('${item.id}', -1)"
                      aria-label="Diminuer quantité">−</button>
              <span class="qnum">${item.qty || 1}</span>
              <button class="qbtn" onclick="adjustQty('${item.id}', 1)"
                      aria-label="Augmenter quantité">+</button>

              <div class="iprice"
                   onclick="inlineEditPrice('${item.id}')"
                   role="button" tabindex="0"
                   aria-label="Prix de ${esc(item.text)}">
                <span id="pr-${item.id}">
                  ${item.price
                    ? item.price.toFixed(2) + '€'
                    : '<span style="color:var(--tx3)">€</span>'}
                </span>
              </div>

              <button class="idel" onclick="deleteItem('${item.id}')"
                      aria-label="Supprimer ${esc(item.text)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </li>`;
      });
    });

    listEl.innerHTML = html;
  }

  document.getElementById('totCount').textContent =
    `${items.length} article${items.length !== 1 ? 's' : ''}`;

  updateBudget();
}


/* =============================================================
   8. RENDU – GRILLE DE LISTES (avec bouton caméra)
============================================================= */

/** Construit les cartes de listes */
function renderLists() {
  const grid    = document.getElementById('lgrid');
  const emptyEl = document.getElementById('listsEmpty');

  if (!lists.length) {
    grid.innerHTML        = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  grid.innerHTML = lists.map(list => {
    const total    = list.items.length;
    const done     = list.items.filter(i => i.ck).length;
    const pct      = total > 0 ? (done / total) * 100 : 0;
    const isActive = list.id === activeId;

    return `
      <div class="lcard${isActive ? ' sel' : ''}"
           onclick="pickList('${list.id}')"
           role="button" tabindex="0"
           aria-label="Sélectionner ${esc(list.name)}"
           aria-pressed="${isActive}">
        <div class="lbanner" style="background:${list.color}22">${list.emoji || '🛒'}</div>
        <div class="linfo">
          <div class="lname" title="${esc(list.name)}">${esc(list.name)}</div>
          <div class="lstats">${total} article${total !== 1 ? 's' : ''} · ${done} coché${done !== 1 ? 's' : ''}</div>
          <div class="lprog" role="progressbar"
               aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
            <div class="lprogf" style="width:${pct}%; background:${list.color}"></div>
          </div>
        </div>
        <div class="lbtns">
          <!-- Bouton caméra pour ajouter/voir la carte du magasin -->
          <button class="lbtn map" onclick="event.stopPropagation(); captureMap('${list.id}')" aria-label="Ajouter une photo du magasin">📷</button>
          <button class="lbtn"
                  onclick="event.stopPropagation(); renameList('${list.id}')"
                  aria-label="Renommer ${esc(list.name)}">✏️</button>
          <button class="lbtn danger"
                  onclick="event.stopPropagation(); removeList('${list.id}')"
                  aria-label="Supprimer ${esc(list.name)}">🗑</button>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.lcard').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') card.click();
    });
  });
}


/* =============================================================
   9. GESTION DU BUDGET
============================================================= */

/** Lit le budget saisi et sauvegarde */
function onBudgetChange() {
  budget = parseFloat(document.getElementById('budgetIn').value) || 0;
  saveData();
  updateBudget();
}

/**
 * Recalcule dépensé / restant / barre / alerte.
 * La barre de progression utilise --p (thème) via CSS,
 * sauf quand elle passe en mode avertissement (.w) ou dépassement (.e).
 */
function updateBudget() {
  const items = lists.find(l => l.id === activeId)?.items || [];
  const spent = items.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);
  const rem   = budget - spent;
  const pct   = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  document.getElementById('spentV').textContent = spent.toFixed(2) + ' €';

  const remEl = document.getElementById('remV');
  remEl.textContent = Math.abs(rem).toFixed(2) + ' €';
  remEl.className   = 'bst-val ' + (rem < 0 ? 'err' : 'ok');

  const fill = document.getElementById('pfill');
  fill.style.width = pct + '%';
  fill.className   = 'pfill' + (pct >= 100 ? ' e' : pct >= 80 ? ' w' : '');

  document.getElementById('pbarWrap')?.setAttribute('aria-valuenow', Math.round(pct));

  const alertEl = document.getElementById('balert');
  if (rem < 0) {
    alertEl.classList.add('on');
    document.getElementById('balertTxt').textContent =
      'Dépassement de ' + Math.abs(rem).toFixed(2) + ' €';
    if (cfg.sound !== false && !alertPlayed) {
      alertPlayed = true;
      playSound();
    }
  } else {
    alertEl.classList.remove('on');
    alertPlayed = false;
  }
}


/* =============================================================
   10. CRUD ARTICLES
============================================================= */

/** Coche / décoche un article */
function toggleCheck(itemId) {
  const item = getItem(itemId);
  if (!item) return;
  item.ck = !item.ck;
  saveData();
  renderHome();
}

/** Ajuste la quantité d'un article */
function adjustQty(itemId, delta) {
  const item = getItem(itemId);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveData();
  renderHome();
}

/** Supprime un article avec annulation possible */
function deleteItem(itemId) {
  const list = lists.find(l => l.id === activeId);
  if (!list) return;

  const idx = list.items.findIndex(i => i.id === itemId);
  if (idx < 0) return;

  const deleted = list.items.splice(idx, 1)[0];
  saveData();
  renderHome();

  showSnack(`"${deleted.text}" supprimé`, 'Annuler', () => {
    list.items.splice(idx, 0, deleted);
    saveData();
    renderHome();
  });
}

/**
 * Édition inline du prix directement dans la ligne article.
 * Remplace le span par un input temporaire.
 */
function inlineEditPrice(itemId) {
  const priceSpan = document.getElementById(`pr-${itemId}`);
  if (!priceSpan || priceSpan.tagName === 'INPUT') return;

  const item  = getItem(itemId);
  const input = document.createElement('input');
  input.type      = 'number';
  input.step      = '0.01';
  input.min       = '0';
  input.value     = item?.price || '';
  input.inputMode = 'decimal';
  input.style.cssText = `
    width:60px; border:none;
    border-bottom:1.5px solid var(--p);
    background:transparent; text-align:right;
    font-size:13px; font-family:inherit; color:var(--tx);
  `;
  input.addEventListener('blur',    () => { if (item) { item.price = parseFloat(input.value) || 0; saveData(); renderHome(); } });
  input.addEventListener('keydown', e  => { if (e.key === 'Enter') input.blur(); });

  priceSpan.replaceWith(input);
  setTimeout(() => input.focus(), 10);
}

/** Retourne un article par ID dans la liste active */
function getItem(itemId) {
  return lists.find(l => l.id === activeId)?.items.find(i => i.id === itemId);
}


/* =============================================================
   11. BOTTOM SHEET : AJOUTER / MODIFIER UN ARTICLE
   MULTI-AJOUT : si le champ "Nom" contient des virgules,
   chaque segment devient un article séparé.
   Le prix, la note et la quantité s'appliquent à chaque article
   en ajout simple. En multi-ajout, le prix est omis (à saisir
   individuellement sur chaque ligne ensuite).
============================================================= */

/** Ouvre le sheet en mode Ajout */
function openAddItem() {
  if (!activeId) {
    showSnack('Créez d\'abord une liste 👉 Mes Listes');
    return;
  }

  editItemId = null;
  currentQty = 1;

  document.getElementById('shItemTitle').textContent = 'Ajouter un article';
  document.getElementById('iSubmit').textContent     = 'Ajouter';
  document.getElementById('iSubmit').disabled        = true;
  document.getElementById('iName').value             = '';
  document.getElementById('iPrice').value            = '';
  document.getElementById('iNote').value             = '';
  document.getElementById('iCat').value              = '';
  document.getElementById('qDisp').textContent       = '1';
  document.getElementById('iNameHint').textContent   = '';

  /* Affiche tous les champs (mode simple par défaut) */
  toggleMultiMode(false);

  openSheet('shItem');
  setTimeout(() => document.getElementById('iName').focus(), 320);
}

/** Ouvre le sheet en mode Modification */
function openEditItem(itemId) {
  const item = getItem(itemId);
  if (!item) return;

  editItemId = itemId;
  currentQty = item.qty || 1;

  document.getElementById('shItemTitle').textContent = 'Modifier l\'article';
  document.getElementById('iSubmit').textContent     = 'Enregistrer';
  document.getElementById('iSubmit').disabled        = false;
  document.getElementById('iName').value             = item.text;
  document.getElementById('iPrice').value            = item.price || '';
  document.getElementById('iNote').value             = item.note  || '';
  document.getElementById('iCat').value              = item.cat   || '';
  document.getElementById('qDisp').textContent       = currentQty;
  document.getElementById('iNameHint').textContent   = '';

  toggleMultiMode(false);

  openSheet('shItem');
}

/** Ajuste la quantité dans le stepper */
function adjustSheetQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById('qDisp').textContent = currentQty;
}

/**
 * Valide le champ nom et détecte le mode multi-ajout.
 * Si plusieurs noms séparés par des virgules sont détectés :
 *   - affiche un indicateur du nombre d'articles à créer
 *   - masque les champs prix/note/quantité (non pertinents en masse)
 */
function validateItemForm() {
  const raw     = document.getElementById('iName').value;
  const filled  = raw.trim().length > 0;
  const names   = parseNames(raw);
  const isMulti = names.length > 1;

  document.getElementById('iSubmit').disabled = !filled;

  /* Indicateur multi-ajout */
  const hint = document.getElementById('iNameHint');
  if (isMulti) {
    hint.textContent = `${names.length} articles seront ajoutés · prix à renseigner individuellement`;
  } else {
    hint.textContent = '';
  }

  /* Masque qty/prix/note en mode multi, les affiche en mode simple */
  toggleMultiMode(isMulti && !editItemId);
}

/**
 * Affiche ou masque les champs qty/prix/note selon le mode.
 * @param {boolean} isMulti
 */
function toggleMultiMode(isMulti) {
  ['fldQty', 'fldPrice', 'fldNote'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isMulti ? 'none' : 'block';
  });
}

/**
 * Découpe la saisie en noms d'articles propres.
 * "Pain, Lait , Beurre" → ["Pain", "Lait", "Beurre"]
 * @param {string} raw
 * @returns {string[]}
 */
function parseNames(raw) {
  return raw.split(',').map(n => n.trim()).filter(n => n.length > 0);
}

/**
 * Confirme l'ajout ou la modification.
 *
 * Mode MULTI (plusieurs noms séparés par virgule) :
 *   → Crée un article par nom, dans la catégorie choisie.
 *   → Prix à 0 (l'utilisateur les renseigne ensuite individuellement
 *     en cliquant sur "€" dans la ligne).
 *
 * Mode SIMPLE (un seul nom) :
 *   → Crée / modifie avec tous les champs (qty, prix, note, cat).
 */
function confirmItem() {
  const raw   = document.getElementById('iName').value.trim();
  if (!raw) return;

  const list  = lists.find(l => l.id === activeId);
  if (!list) return;

  const names   = parseNames(raw);
  const isMulti = names.length > 1 && !editItemId;
  const cat     = document.getElementById('iCat').value;

  if (isMulti) {
    /* --- Multi-ajout --- */
    names.forEach((name, idx) => {
      list.items.push({
        id:    (Date.now() + idx).toString(),
        text:  name,
        qty:   1,       /* quantité par défaut */
        price: 0,       /* prix à saisir individuellement */
        note:  '',
        cat,
        ck:    false,
      });
    });
    saveData();
    closeSheet();
    renderHome();
    showSnack(`${names.length} articles ajoutés ✓`);

  } else {
    /* --- Ajout ou modification simple --- */
    const price = parseFloat(document.getElementById('iPrice').value) || 0;
    const note  = document.getElementById('iNote').value.trim();

    if (editItemId) {
      /* Modification */
      const item = list.items.find(i => i.id === editItemId);
      if (item) {
        item.text  = names[0];
        item.qty   = currentQty;
        item.price = price;
        item.note  = note;
        item.cat   = cat;
      }
    } else {
      /* Ajout simple */
      list.items.push({
        id:    Date.now().toString(),
        text:  names[0],
        qty:   currentQty,
        price,
        note,
        cat,
        ck:    false,
      });
    }

    saveData();
    closeSheet();
    renderHome();
    showSnack(editItemId ? `${names[0]} modifié ✓` : `${names[0]} ajouté ✓`);
  }
}

/**
 * Construit les chips de suggestions rapides.
 * COMPORTEMENT : cliquer AJOUTE le nom au champ avec une virgule,
 * permettant de constituer un lot en cliquant plusieurs chips.
 */
function buildQuickChips() {
  const container = document.getElementById('qChips');
  container.innerHTML = QUICK_ITEMS.map(name =>
    `<button class="chip" aria-label="Ajouter ${name} à la saisie">${name}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input   = document.getElementById('iName');
      const current = input.value.trim();
      /* Ajoute avec virgule si le champ contient déjà du texte */
      input.value = current ? current + ', ' + chip.textContent : chip.textContent;
      input.dispatchEvent(new Event('input')); /* Déclenche la validation */
    });
  });
}


/* =============================================================
   12. BOTTOM SHEET : CRÉER UNE LISTE
============================================================= */

/** Ouvre le sheet de création de liste */
function openAddList() {
  document.getElementById('lName').value       = '';
  document.getElementById('lEmoji').value      = '🛒';
  document.getElementById('lSubmit').disabled  = true;

  buildColorGrid('lCGrid', null, onListColorPick);
  document.getElementById('lColor').value = '#3B82F6';

  openSheet('shList');
  setTimeout(() => document.getElementById('lName').focus(), 320);
}

/** Valide le bouton "Créer" */
function validateListForm() {
  document.getElementById('lSubmit').disabled =
    !document.getElementById('lName').value.trim().length;
}

/** Confirme la création d'une liste */
function confirmList() {
  const name  = document.getElementById('lName').value.trim();
  if (!name) return;

  const emoji = document.getElementById('lEmoji').value || '🛒';
  const color = document.getElementById('lColor').value || '#3B82F6';
  const id    = Date.now().toString();

  lists.push({ id, name, emoji, color, items: [], mapImage: null });

  if (!activeId) activeId = id;

  saveData();
  closeSheet();
  renderLists();
  showSnack(`${emoji} ${name} créée ✓`);
}

/** Construit les chips d'emojis */
function buildEmojiChips() {
  const container = document.getElementById('eChips');
  container.innerHTML = EMOJIS.map(e =>
    `<button class="chip" aria-label="Emoji ${e}">${e}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('lEmoji').value = chip.textContent;
    });
  });
}


/* =============================================================
   13. GESTION DES LISTES (CRUD) + CARTE MAGASIN
============================================================= */

/** Sélectionne une liste et redirige vers l'accueil */
function pickList(listId) {
  activeId = listId;
  saveData();
  goTo('home');
}

/** Renomme une liste */
function renameList(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  const newName = prompt('Renommer la liste :', list.name);
  if (newName?.trim()) {
    list.name = newName.trim();
    saveData();
    renderLists();
    if (listId === activeId) {
      document.getElementById('htitle').textContent    = list.name;
      document.getElementById('aListName').textContent = list.name;
    }
  }
}

/** Supprime une liste après confirmation */
function removeList(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  if (!confirm(`Supprimer la liste "${list.name}" et tous ses articles ?`)) return;

  lists    = lists.filter(l => l.id !== listId);
  if (activeId === listId) activeId = lists[0]?.id ?? null;

  saveData();
  renderLists();
  renderHome();
  showSnack('Liste supprimée');
}

/**
 * Capture une image (carte du magasin) pour une liste.
 * L'utilisateur peut prendre une photo ou choisir une image depuis la galerie.
 */
function captureMap(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  // Créer un input file sans l'attribut "capture" pour laisser le choix
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      list.mapImage = readerEvent.target.result; // base64
      saveData();
      // Mettre à jour l'affichage si c'est la liste active
      if (listId === activeId) renderHome();
      renderLists();
      showSnack('Carte du magasin enregistrée');
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

/** Visualise la carte du magasin dans une modal simple */
function viewMap() {
  const list = lists.find(l => l.id === activeId);
  if (!list || !list.mapImage) return;
  // On utilise la même modal que le logo ? On peut en créer une dédiée ou réutiliser.
  const modal = document.getElementById('logoModal');
  const img = modal.querySelector('img');
  img.src = list.mapImage;
  modal.style.display = 'flex';
}

/** Supprime la carte du magasin de la liste active */
function deleteMap() {
  const list = lists.find(l => l.id === activeId);
  if (!list || !list.mapImage) return;
  if (!confirm('Supprimer la carte du magasin ?')) return;
  list.mapImage = null;
  saveData();
  renderHome();
  showSnack('Carte supprimée');
}


/* =============================================================
   14. PARTAGE / EXPORT .TXT
   Génère un fichier texte lisible de la liste active :
     ✓ / ☐  Nom de l'article  x quantité  —  prix total  (note)
   Tente d'abord l'API Web Share (mobile), sinon télécharge le .txt.
============================================================= */

/** Exporte / partage la liste active au format .txt */
function shareList() {
  const list = lists.find(l => l.id === activeId);

  if (!list) {
    showSnack('Aucune liste sélectionnée');
    return;
  }
  if (!list.items.length) {
    showSnack('La liste est vide, rien à partager');
    return;
  }

  const text = buildTxtContent(list);

  /* Tente l'API Web Share (mobile / navigateurs récents) */
  if (navigator.share) {
    navigator.share({
      title: list.name,
      text,
    }).catch(() => {
      /* Fallback téléchargement si l'utilisateur annule ou erreur */
      downloadTxt(text, list.name);
    });
  } else {
    downloadTxt(text, list.name);
  }
}

/**
 * Construit le contenu texte lisible de la liste.
 * Format par article :
 *   ✓  Pain                x2  —  3.40 €  (bio si possible)
 *   ☐  Lait                x1
 *
 * @param {Object} list
 * @returns {string}
 */
function buildTxtContent(list) {
  const sep  = '─'.repeat(36);
  const date = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  let txt = '';
  txt += `${list.emoji || '🛒'}  ${list.name.toUpperCase()}\n`;
  txt += `${sep}\n`;
  txt += `📅 ${date}\n\n`;

  /* Groupement par catégorie */
  const groups = {};
  list.items.forEach(item => {
    const key = item.cat || 'Divers';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  Object.entries(groups).forEach(([cat, items]) => {
    /* Titre de catégorie (sauf si tout est dans "Divers" et une seule catégorie) */
    if (cat !== 'Divers' || Object.keys(groups).length > 1) {
      txt += `\n▸ ${cat}\n`;
    }

    items.forEach(item => {
      const check    = item.ck ? '✓' : '☐';
      const qty      = (item.qty || 1) > 1 ? `  x${item.qty}` : '    ';
      const price    = item.price
        ? `  —  ${(item.price * (item.qty || 1)).toFixed(2)} €`
        : '';
      const note     = item.note ? `  (${item.note})` : '';
      /* Alignement du nom sur 22 caractères */
      const name     = item.text.padEnd(22, ' ');

      txt += `  ${check}  ${name}${qty}${price}${note}\n`;
    });
  });

  /* Total général */
  const total = list.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const done  = list.items.filter(i => i.ck).length;

  txt += `\n${sep}\n`;
  txt += `✅ Cochés : ${done} / ${list.items.length} article${list.items.length !== 1 ? 's' : ''}\n`;
  if (total > 0) {
    txt += `💰 Total  : ${total.toFixed(2)} €\n`;
  }
  txt += `\n📱 Courses Malin\n`;

  return txt;
}

/**
 * Télécharge un fichier .txt.
 * @param {string} content
 * @param {string} listName
 */
function downloadTxt(content, listName) {
  const blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  /* Nom de fichier sécurisé (retire les caractères spéciaux) */
  const filename = listName.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();

  anchor.href     = url;
  anchor.download = `${filename}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}


/* =============================================================
   15. SON & ALERTE BUDGET
============================================================= */

/** Joue le son d'alerte sélectionné */
function playSound() {
  stopSound();
  const choice = document.getElementById('soundSel').value;
  audioInstance = new Audio(`assets/sound/Alarm${choice}.mp3`);
  audioInstance.play().catch(playFallbackBeep);
}

/** Arrête le son en cours */
function stopSound() {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
    audioInstance = null;
  }
}

/** Bip synthétique via Web Audio API (fallback si MP3 absent) */
function playFallbackBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.warn('Web Audio API indisponible :', e);
  }
}


/* =============================================================
   16. OVERLAY & SHEETS
============================================================= */

/** Ouvre un bottom sheet */
function openSheet(sheetId) {
  openSheetId = sheetId;
  document.getElementById('ovl').classList.add('on');
  document.getElementById(sheetId).classList.add('on');
  document.getElementById(sheetId).setAttribute('aria-hidden', 'false');
}

/** Ferme le sheet ouvert */
function closeSheet() {
  if (openSheetId) {
    document.getElementById(openSheetId).classList.remove('on');
    document.getElementById(openSheetId).setAttribute('aria-hidden', 'true');
  }
  document.getElementById('ovl').classList.remove('on');
  openSheetId = null;
}


/* =============================================================
   17. MODAL LOGO
============================================================= */

function showLogoModal() {
  document.getElementById('logoModal').style.display = 'flex';
}

function closeLogoModal() {
  document.getElementById('logoModal').style.display = 'none';
}


/* =============================================================
   18. SNACKBAR
============================================================= */

/**
 * Affiche une notification temporaire.
 * @param {string}   message  - Texte à afficher
 * @param {string}   [action] - Libellé du bouton optionnel
 * @param {Function} [cb]     - Callback si le bouton est cliqué
 */
function showSnack(message, action, cb) {
  const el = document.getElementById('snk');
  snkCallback = cb || null;

  el.innerHTML = action
    ? `${esc(message)}<button onclick="triggerSnackAction()" style="background:none;border:none;color:var(--p);font-weight:700;cursor:pointer;font-family:inherit;font-size:14px;margin-left:8px">${esc(action)}</button>`
    : esc(message);

  el.classList.add('on');
  clearTimeout(snkTimer);
  snkTimer = setTimeout(() => el.classList.remove('on'), 4000);
}

/** Déclenche le callback du snackbar */
function triggerSnackAction() {
  if (snkCallback) { snkCallback(); snkCallback = null; }
  document.getElementById('snk').classList.remove('on');
}


/* =============================================================
   19. UTILITAIRES
============================================================= */

/**
 * Échappe les caractères HTML (anti-XSS).
 * @param {*} str
 * @returns {string}
 */
function esc(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}


/* =============================================================
   20. ATTACHEMENT DES ÉCOUTEURS D'ÉVÉNEMENTS
   Centralisés ici → le HTML reste purement déclaratif.
============================================================= */

function attachListeners() {

  /* ---- Header ---- */
  document.getElementById('btnBack').addEventListener('click', () => goTo('home'));
  document.getElementById('headerLogo').addEventListener('click', showLogoModal);
  document.getElementById('btnAdd').addEventListener('click', openAddItem);

  /* ---- Navigation ---- */
  document.getElementById('t-home').addEventListener('click',     () => goTo('home'));
  document.getElementById('t-lists').addEventListener('click',    () => goTo('lists'));
  document.getElementById('t-settings').addEventListener('click', () => goTo('settings'));

  /* ---- FAB ---- */
  document.getElementById('fab').addEventListener('click', openAddItem);

  /* ---- Overlay → ferme le sheet ---- */
  document.getElementById('ovl').addEventListener('click', closeSheet);

  /* ---- Vue Accueil ---- */
  document.getElementById('budgetIn').addEventListener('change', onBudgetChange);
  document.getElementById('searchIn').addEventListener('input',  renderHome);
  document.getElementById('btnChangeList').addEventListener('click', () => goTo('lists'));
  document.getElementById('btnShare').addEventListener('click', shareList);
  document.getElementById('viewMapBtn').addEventListener('click', viewMap);
  document.getElementById('changeMapBtn').addEventListener('click', () => {
    if (activeId) captureMap(activeId);
  });
  document.getElementById('deleteMapBtn').addEventListener('click', deleteMap);
  document.getElementById('mapThumb').addEventListener('click', viewMap);


  /* ---- État vide (emptyState) : comportement conditionnel ---- */
  document.getElementById('emptyState').addEventListener('click', () => {
    if (lists.length === 0) {
      // Aucune liste n'existe → aller vers la création de liste
      goTo('lists');
    } else {
      // Une liste existe (même si elle est vide) → ouvrir l'ajout d'article
      openAddItem();
    }
  });

  /* ---- Sheet Article ---- */
  document.getElementById('iName').addEventListener('input', validateItemForm);
  document.getElementById('qtyMinus').addEventListener('click', () => adjustSheetQty(-1));
  document.getElementById('qtyPlus').addEventListener('click',  () => adjustSheetQty(+1));
  document.getElementById('iSubmit').addEventListener('click', confirmItem);

  /* ---- Sheet Liste ---- */
  document.getElementById('lName').addEventListener('input', validateListForm);
  document.getElementById('lSubmit').addEventListener('click', confirmList);

  /* ---- Vue Mes Listes ---- */
  document.getElementById('btnNewList').addEventListener('click', openAddList);

  /* ---- Réglages ---- */
  document.getElementById('darkTog').addEventListener('click',    toggleDark);
  document.getElementById('soundTog').addEventListener('click',   toggleSound);
  document.getElementById('soundSel').addEventListener('change',  saveConfig);
  document.getElementById('btnPlaySound').addEventListener('click', playSound);
  document.getElementById('btnStopSound').addEventListener('click', stopSound);
  document.getElementById('btnReset').addEventListener('click',   resetAll);

  /* ---- Swipe bas pour fermer un sheet ---- */
  let touchStartY = 0;
  document.querySelectorAll('.sheet').forEach(sheet => {
    sheet.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    sheet.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - touchStartY > 80) closeSheet();
    }, { passive: true });
  });

  /* ---- Touche Échap → ferme le sheet ---- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openSheetId) closeSheet();
  });

  /* ---- Modal logo : clic sur l'overlay ferme ---- */
  document.getElementById('logoModal').addEventListener('click', closeLogoModal);
}


/* =============================================================
   DÉMARRAGE
============================================================= */
document.addEventListener('DOMContentLoaded', init);