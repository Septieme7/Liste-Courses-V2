/* =============================================================
   COURSES MALIN · script.js
   Version finale avec toutes les fonctionnalités
============================================================= */

/* =============================================================
   1. CONFIGURATION & CONSTANTES
============================================================= */
const COLORS = [
  { n: 'blue',   h: '#3B82F6' },
  { n: 'green',  h: '#10B981' },
  { n: 'red',    h: '#EF4444' },
  { n: 'purple', h: '#8B5CF6' },
  { n: 'orange', h: '#F59E0B' },
  { n: 'pink',   h: '#EC4899' },
  { n: 'gold',   h: '#D97706' },
];

const EMOJIS = ['🛒', '🏪', '🍎', '🥗', '🏠', '🎉', '💊', '🐾', '🌿', '🍕', '🧙‍♂️', '🖕', '🤬', '💕', '🛍️', '📦'];

// Clés pour les suggestions rapides (traduites)
const QUICK_ITEMS_KEYS = [
  'quick.bread', 'quick.milk', 'quick.eggs', 'quick.butter', 'quick.cheese', 'quick.yogurt',
  'quick.water', 'quick.apples', 'quick.bananas', 'quick.chicken', 'quick.pasta', 'quick.rice',
  'quick.coffee', 'quick.juice', 'quick.flour', 'quick.sugar', 'quick.salt', 'quick.oil',
  'quick.dinosaur', 'quick.unicorn', 'quick.chocolate', 'quick.icecream', 'quick.sausages',
  'quick.fish', 'quick.carrots', 'quick.tomatoes'
];

// Couleurs des catégories par défaut
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
  '🖕 Sheet List':         '#d4ea46',
  '🧙‍♂️ Magic List':        '#a855f7',
  '🤬 SaMére List':        '#ef4444',
  '💕 Love 💕':            '#ec4899',
};

// Mapping pour la traduction des catégories par défaut
const CATEGORY_MAP = {
  '🥦 Fruits & Légumes': 'fruits',
  '🥩 Viandes & Poissons': 'meat',
  '🥛 Produits Laitiers': 'dairy',
  '🥖 Boulangerie': 'bakery',
  '🥫 Épicerie': 'grocery',
  '🧴 Hygiène': 'hygiene',
  '🧹 Entretien': 'cleaning',
  '🧃 Boissons': 'drinks',
  '🍦 Surgelés': 'frozen',
  '💕 Love': 'love',
  '🤬 SaMéreList': 'mother',
  '🖕 Sheet List': 'sheet',
  '🧙‍♂️ Magic List': 'magic'
};

const LS_LISTS  = 'cm_lists';
const LS_CFG    = 'cm_cfg';
const LS_BUDGET = 'cm_budget';
const LS_ACTIVE = 'cm_active';

/* =============================================================
   2. ÉTAT GLOBAL
============================================================= */
let lists        = [];
let cfg          = {};
let budget       = 50;
let activeId     = null;
let editItemId   = null;
let currentQty   = 1;
let alertPlayed  = false;
let openSheetId  = null;
let snkTimer     = null;
let snkCallback  = null;
let audioInstance= null;
let triggeredThresholds = {};

// Catégories personnalisées
let customCategories = [];
let editingCategoryIndex = -1; // pour le formulaire de catégorie

// Scan
let html5QrCode = null;
let multiScanMode = false;
let lastScannedBarcode = null;
let lastScannedProductData = null;

// Éditeur d'image
let cropper = null;
let currentListIdForImage = null;

// Monnaie
let currency = '€';

/* =============================================================
   3. INITIALISATION
============================================================= */
function init() {
  loadData();
  loadCategories();
  buildColorGrid('cGrid',  cfg.color || 'blue', onMainColorPick);
  buildColorGrid('lCGrid', null,                onListColorPick);
  buildEmojiChips();
  buildQuickChips();
  applyTheme();
  syncSettingsUI();
  attachListeners();
  initSwipe();

  // Appliquer la taille d'affichage
  if (cfg.uiSize) {
    document.body.classList.add('size-' + cfg.uiSize);
  } else {
    document.body.classList.add('size-md');
  }

  // Charger la langue avant le premier rendu
  if (cfg.lang) {
    loadLanguage(cfg.lang).then(() => {
      renderAll();
      buildCategorySelect();
    });
  } else {
    // Langue par défaut : français
    loadLanguage('fr').then(() => {
      renderAll();
      buildCategorySelect();
    });
  }

  if (!cfg.thresholds) {
    cfg.thresholds = { 50: true, 80: true, 100: true };
  }
}

/* =============================================================
   4. PERSISTANCE
============================================================= */
function loadData() {
  try { lists  = JSON.parse(localStorage.getItem(LS_LISTS))  || []; } catch { lists  = []; }
  try { cfg    = JSON.parse(localStorage.getItem(LS_CFG))    || {}; } catch { cfg    = {}; }

  budget   = parseFloat(localStorage.getItem(LS_BUDGET)) || 50;
  activeId = localStorage.getItem(LS_ACTIVE) || (lists[0]?.id ?? null);
  
  if (cfg.currency) currency = cfg.currency;

  const budgetIn = document.getElementById('budgetIn');
  if (budgetIn) budgetIn.value = budget;
  
  window.cfg = cfg;
}

function saveData() {
  localStorage.setItem(LS_LISTS,  JSON.stringify(lists));
  localStorage.setItem(LS_BUDGET, budget);
  localStorage.setItem(LS_ACTIVE, activeId ?? '');
}

function saveConfig() {
  cfg.soundChoice = document.getElementById('soundSel')?.value || 'A';
  cfg.thresholds = {
    50: document.getElementById('threshold50')?.checked || false,
    80: document.getElementById('threshold80')?.checked || false,
    100: document.getElementById('threshold100')?.checked || false
  };
  cfg.categories = customCategories;
  cfg.currency = document.getElementById('currencySelector')?.value || '€';
  currency = cfg.currency;
  cfg.uiSize = document.getElementById('sizeSelector')?.value || 'md';
  localStorage.setItem(LS_CFG, JSON.stringify(cfg));
  // Mettre à jour l'affichage des prix
  renderHome();
}

function resetAll() {
  if (!confirm(t('settings.confirm_reset'))) return;
  localStorage.clear();
  location.reload();
}

/* =============================================================
   5. GESTION DES CATÉGORIES
============================================================= */
function loadCategories() {
  customCategories = cfg.categories || [];
}

function saveCategories() {
  saveConfig();
  buildCategorySelect();
  renderHome();
}

function translateCategory(catValue) {
  if (!catValue) return '';
  const custom = customCategories.find(c => c.name === catValue);
  if (custom) return custom.emoji + ' ' + custom.name;
  const key = CATEGORY_MAP[catValue];
  return key ? t('category.' + key) : catValue;
}

function getCategoryColor(catValue) {
  const custom = customCategories.find(c => c.name === catValue);
  if (custom) return custom.color;
  return CAT_COLORS[catValue] || '#64748B';
}

function buildCategorySelect() {
  const select = document.getElementById('iCat');
  if (!select) return;
  let html = '<option value="" data-i18n="item.no_category">' + t('item.no_category') + '</option>';
  
  Object.keys(CAT_COLORS).forEach(cat => {
    const key = CATEGORY_MAP[cat];
    const display = key ? t('category.' + key) : cat;
    html += `<option value="${cat}">${display}</option>`;
  });
  
  customCategories.forEach(cat => {
    html += `<option value="${cat.name}" style="color:${cat.color};">${cat.emoji} ${cat.name}</option>`;
  });
  
  select.innerHTML = html;
}

// Fonctions pour la gestion des catégories (appelées depuis le formulaire)
function openCategoryEditor(index) {
  editingCategoryIndex = index;
  const sheet = document.getElementById('shCategoryEdit');
  if (!sheet) return;
  
  renderCategoriesList(); // Affiche la liste avec boutons supprimer
  
  if (index === -1) {
    // Nouvelle catégorie
    document.getElementById('catName').value = '';
    document.getElementById('catEmoji').value = '🥦';
    document.getElementById('catColor').value = '#10B981';
  } else {
    const cat = customCategories[index];
    document.getElementById('catName').value = cat.name;
    document.getElementById('catEmoji').value = cat.emoji;
    document.getElementById('catColor').value = cat.color;
  }
  buildEmojiChipsForCategory();
  buildColorGridForCategory(document.getElementById('catColor').value);
  openSheet('shCategoryEdit');
}

function renderCategoriesList() {
  const container = document.getElementById('categoryList');
  if (!container) return;
  let html = '';
  // Catégories par défaut (non supprimables) - CORRECTION : afficher display sans emoji en double
  Object.keys(CAT_COLORS).forEach(cat => {
    const key = CATEGORY_MAP[cat];
    const display = key ? t('category.' + key) : cat; // display contient déjà l'emoji
    html += `
      <div class="srow" style="margin-bottom: 8px;">
        <span style="background:${CAT_COLORS[cat]}22; padding:4px 8px; border-radius:12px;">
          ${display}
        </span>
        <div>
          <span style="color:var(--tx3); font-size:0.8em;">(défaut)</span>
        </div>
      </div>`;
  });
  // Catégories personnalisées
  customCategories.forEach((cat, index) => {
    html += `
      <div class="srow" style="margin-bottom: 8px;">
        <span style="background:${cat.color}22; padding:4px 8px; border-radius:12px;">
          ${cat.emoji} ${cat.name}
        </span>
        <div>
          <button class="lbtn" onclick="editCategory(${index})">✏️</button>
          <button class="lbtn danger" onclick="deleteCategory(${index})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>`;
  });
  container.innerHTML = html;
}

window.editCategory = function(index) {
  openCategoryEditor(index);
};

window.deleteCategory = function(index) {
  if (confirm('Supprimer cette catégorie ?')) {
    customCategories.splice(index, 1);
    saveCategories();
    renderCategoriesList();
    buildCategorySelect();
    renderHome();
  }
};

function buildEmojiChipsForCategory() {
  const container = document.getElementById('catEmojiChips');
  if (!container) return;
  container.innerHTML = EMOJIS.map(e =>
    `<button class="chip" aria-label="Emoji ${e}">${e}</button>`
  ).join('');
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('catEmoji').value = chip.textContent;
    });
  });
}

function buildColorGridForCategory(activeColor) {
  const container = document.getElementById('catColorGrid');
  if (!container) return;
  container.innerHTML = COLORS.map(c =>
    `<div class="csw" style="background:${c.h}" data-color="${c.h}" role="radio" aria-label="Couleur ${c.n}" tabindex="0"></div>`
  ).join('');
  container.querySelectorAll('.csw').forEach(dot => {
    dot.addEventListener('click', () => {
      document.getElementById('catColor').value = dot.dataset.color;
      container.querySelectorAll('.csw').forEach(d => d.classList.remove('on'));
      dot.classList.add('on');
    });
    if (dot.dataset.color === activeColor) {
      dot.classList.add('on');
    }
  });
}

function saveCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) {
    showSnack('Le nom est requis');
    return;
  }
  const emoji = document.getElementById('catEmoji').value || '🥦';
  const color = document.getElementById('catColor').value || '#10B981';
  
  if (editingCategoryIndex === -1) {
    customCategories.push({ name, emoji, color });
  } else {
    customCategories[editingCategoryIndex] = { name, emoji, color };
  }
  saveCategories();
  renderCategoriesList();
  buildCategorySelect();
  renderHome();
  closeSheet(); // ferme le sheet d'édition
}

function cancelCategoryEdit() {
  closeSheet();
}

/* =============================================================
   6. THÈME & COULEURS
============================================================= */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', cfg.dark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-color', cfg.color || 'blue');
}

function toggleDark() {
  cfg.dark = !cfg.dark;
  const tog = document.getElementById('darkTog');
  if (tog) {
    tog.classList.toggle('on', cfg.dark);
    tog.setAttribute('aria-checked', cfg.dark);
  }
  saveConfig();
  applyTheme();
}

function toggleSound() {
  cfg.sound = (cfg.sound === false) ? true : false;
  const tog = document.getElementById('soundTog');
  if (tog) {
    tog.classList.toggle('on', cfg.sound !== false);
    tog.setAttribute('aria-checked', cfg.sound !== false);
  }
  saveConfig();
}

function buildColorGrid(gridId, active, callback) {
  const el = document.getElementById(gridId);
  if (!el) return;
  el.innerHTML = COLORS.map(c => `
    <div class="csw${active === c.n ? ' on' : ''}" style="background:${c.h}" data-name="${c.n}" role="radio" aria-checked="${active === c.n}" aria-label="${t('settings.color')} ${c.n}" tabindex="0"></div>
  `).join('');
  el.querySelectorAll('.csw').forEach(dot => {
    dot.addEventListener('click',   () => callback(dot.dataset.name));
    dot.addEventListener('keydown', e  => {
      if (e.key === 'Enter' || e.key === ' ') callback(dot.dataset.name);
    });
  });
}

function onMainColorPick(name) {
  cfg.color = name;
  saveConfig();
  applyTheme();
  buildColorGrid('cGrid', name, onMainColorPick);
}

function onListColorPick(name) {
  const lColor = document.getElementById('lColor');
  if (lColor) lColor.value = COLORS.find(c => c.n === name)?.h || '#3B82F6';
  buildColorGrid('lCGrid', name, onListColorPick);
}

function syncSettingsUI() {
  const soundOn = cfg.sound !== false;
  const darkTog = document.getElementById('darkTog');
  const soundTog = document.getElementById('soundTog');

  if (darkTog) {
    darkTog.classList.toggle('on', !!cfg.dark);
    darkTog.setAttribute('aria-checked', !!cfg.dark);
  }
  if (soundTog) {
    soundTog.classList.toggle('on', soundOn);
    soundTog.setAttribute('aria-checked', soundOn);
  }
  const soundSel = document.getElementById('soundSel');
  if (soundSel) soundSel.value = cfg.soundChoice || 'A';
  
  const langSel = document.getElementById('langSelector');
  if (langSel) {
    langSel.value = cfg.lang || 'fr';
    langSel.addEventListener('change', (e) => {
      loadLanguage(e.target.value);
    });
  }
  
  const currencySel = document.getElementById('currencySelector');
  if (currencySel) {
    currencySel.value = cfg.currency || '€';
    currencySel.addEventListener('change', () => {
      saveConfig();
      renderHome();
    });
  }
  
  const sizeSel = document.getElementById('sizeSelector');
  if (sizeSel) {
    sizeSel.value = cfg.uiSize || 'md';
    sizeSel.addEventListener('change', () => {
      document.body.classList.remove('size-xs', 'size-sm', 'size-md', 'size-lg', 'size-xl');
      document.body.classList.add('size-' + sizeSel.value);
      saveConfig();
    });
  }
  
  const thres = cfg.thresholds || { 50: true, 80: true, 100: true };
  const th50 = document.getElementById('threshold50');
  const th80 = document.getElementById('threshold80');
  const th100 = document.getElementById('threshold100');
  if (th50) th50.checked = thres[50] || false;
  if (th80) th80.checked = thres[80] || false;
  if (th100) th100.checked = thres[100] || false;
}

/* =============================================================
   7. NAVIGATION
============================================================= */
let currentTab = 'home';

function goTo(tab) {
  currentTab = tab;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  const view = document.getElementById(`v-${tab}`);
  if (view) view.classList.add('on');

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('on');
    t.removeAttribute('aria-current');
  });
  if (tab === 'home' || tab === 'lists' || tab === 'settings') {
    const activeTab = document.getElementById(`t-${tab}`);
    if (activeTab) {
      activeTab.classList.add('on');
      activeTab.setAttribute('aria-current', 'page');
    }
  }

  const btnBack = document.getElementById('btnBack');
  if (btnBack) {
    btnBack.style.display = tab === 'home' ? 'none' : 'flex';
  }

  const titles = {
    home: getActiveName(),
    lists: t('nav.lists'),
    settings: t('nav.settings'),
    help: t('nav.help')
  };
  const htitle = document.getElementById('htitle');
  if (htitle) htitle.textContent = titles[tab] || t('nav.help');

  const onHome = tab === 'home';
  const onLists = tab === 'lists';
  const fab = document.getElementById('fab');
  const fabList = document.getElementById('fab-list');
  const btnAdd = document.getElementById('btnAdd');
  if (fab) fab.style.display = onHome ? 'flex' : 'none';
  if (fabList) fabList.style.display = onLists ? 'flex' : 'none';
  if (btnAdd) btnAdd.style.display = onHome ? 'flex' : 'none';

  if (tab === 'lists')    renderLists();
  if (tab === 'home')     renderHome();
  if (tab === 'settings') buildColorGrid('cGrid', cfg.color || 'blue', onMainColorPick);
}

function getActiveName() {
  return lists.find(l => l.id === activeId)?.name || t('app_name');
}

/* =============================================================
   8. RENDU – ACCUEIL
============================================================= */
function renderAll() {
  renderHome();
  renderLists();
}

function renderHome() {
  const list  = lists.find(l => l.id === activeId);
  const items = list?.items || [];

  const htitle = document.getElementById('htitle');
  if (htitle) htitle.textContent = list?.name || t('app_name');
  const aListName = document.getElementById('aListName');
  if (aListName) aListName.textContent = list?.name || t('home.no_list');
  const aListIco = document.getElementById('aListIco');
  if (aListIco) aListIco.textContent = list?.emoji || '🛒';

  const mapContainer = document.getElementById('listMapContainer');
  const mapThumb = document.getElementById('mapThumb');
  if (mapContainer && mapThumb && list && list.mapImage) {
    mapContainer.style.display = 'block';
    mapThumb.src = list.mapImage;
    mapThumb.style.display = 'inline';
  } else if (mapContainer) {
    mapContainer.style.display = 'none';
  }

  const query    = document.getElementById('searchIn')?.value.toLowerCase().trim() || '';
  const filtered = query ? items.filter(i => i.text.toLowerCase().includes(query)) : items;

  const listEl  = document.getElementById('itemsList');
  const emptyEl = document.getElementById('emptyState');
  const fab     = document.getElementById('fab');

  if (!filtered.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (listEl) listEl.innerHTML = '';
    if (fab) fab.classList.add('pulse');
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    if (fab) fab.classList.remove('pulse');

    const groups = {};
    filtered.forEach(item => {
      const key = item.cat || '';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let html = '';

    Object.entries(groups).forEach(([cat, groupItems]) => {
      if (cat) {
        const color = getCategoryColor(cat);
        const catDisplay = translateCategory(cat);
        html += `<div class="chdr" data-cat="${esc(cat)}" style="background:${color}18; color:${color}"><span>${esc(catDisplay)}</span><span class="chdr-count">${groupItems.length}</span></div>`;
      }
      groupItems.forEach(item => {
        const qtyDisplay = item.unit ? formatQuantity(item.qty, item.unit) : item.qty;
        const priceDisplay = item.price ? item.price.toFixed(2) + currency : '<span style="color:var(--tx3)">' + currency + '</span>';
        const pricePerUnitDisplay = item.pricePerUnit ? ` <span class="price-per-unit">(${item.pricePerUnit.toFixed(2)}${currency}/${getUnitSymbol(item.unit)})</span>` : '';

        html += `
          <li class="irow${item.ck ? ' ckd' : ''}" id="ir-${item.id}">
            <button class="icheck${item.ck ? ' on' : ''}" onclick="toggleCheck('${item.id}')" aria-label="${item.ck ? t('home.uncheck') : t('home.check')} ${esc(item.text)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <div class="ibody" onclick="openEditItem('${item.id}')" role="button" tabindex="0" aria-label="${t('common.edit')} ${esc(item.text)}">
              <div class="itxt">${esc(item.text)}</div>
              ${item.note ? `<div class="imeta">${esc(item.note)}</div>` : ''}
            </div>
            <div class="iact">
              <button class="qbtn" onclick="adjustQty('${item.id}', -1)" aria-label="${t('item.decrease')}">−</button>
              <span class="qnum">${qtyDisplay}</span>
              <button class="qbtn" onclick="adjustQty('${item.id}', 1)" aria-label="${t('item.increase')}">+</button>
              <div class="iprice" onclick="inlineEditPrice('${item.id}')" role="button" tabindex="0" aria-label="${t('item.price_label')} ${esc(item.text)}">
                <span id="pr-${item.id}">${priceDisplay}${pricePerUnitDisplay}</span>
              </div>
              <button class="idel" onclick="deleteItem('${item.id}')" aria-label="${t('common.delete')} ${esc(item.text)}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </li>`;
      });
    });
    if (listEl) listEl.innerHTML = html;
    
    if (window.reinitDragDrop) {
      setTimeout(reinitDragDrop, 0);
    }
  }

  let count = items.length;
  let countText = count + ' ' + (count > 1 ? t('home.article_plural') : t('home.article_singular'));
  const totCount = document.getElementById('totCount');
  if (totCount) totCount.textContent = countText;
  
  updateBudget();
}

/* =============================================================
   9. RENDU – LISTES
============================================================= */
function renderLists() {
  const grid    = document.getElementById('lgrid');
  const emptyEl = document.getElementById('listsEmpty');

  if (!lists.length) {
    if (grid) grid.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  if (grid) {
    grid.innerHTML = lists.map(list => {
      const total    = list.items.length;
      const done     = list.items.filter(i => i.ck).length;
      const pct      = total > 0 ? (done / total) * 100 : 0;
      const isActive = list.id === activeId;
      const totalText = total + ' ' + (total > 1 ? t('home.article_plural') : t('home.article_singular'));
      const doneText = done + ' ' + (done > 1 ? t('home.checked_plural') : t('home.checked_singular'));

      return `
        <div class="lcard${isActive ? ' sel' : ''}" onclick="pickList('${list.id}')" role="button" tabindex="0" aria-label="${t('lists.select')} ${esc(list.name)}" aria-pressed="${isActive}">
          <div class="lbanner" style="background:${list.color}22">${list.emoji || '🛒'}</div>
          <div class="linfo">
            <div class="lname" title="${esc(list.name)}">${esc(list.name)}</div>
            <div class="lstats">${totalText} · ${doneText}</div>
            <div class="lprog" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
              <div class="lprogf" style="width:${pct}%; background:${list.color}"></div>
            </div>
          </div>
          <div class="lbtns">
            <button class="lbtn map" onclick="event.stopPropagation(); captureMap('${list.id}')" aria-label="${t('lists.add_map')}">📷</button>
            <button class="lbtn" onclick="event.stopPropagation(); renameList('${list.id}')" aria-label="${t('common.edit')} ${esc(list.name)}">✏️</button>
            <button class="lbtn danger" onclick="event.stopPropagation(); removeList('${list.id}')" aria-label="${t('common.delete')} ${esc(list.name)}">🗑</button>
          </div>
        </div>`;
    }).join('');

    grid.querySelectorAll('.lcard').forEach(card => {
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') card.click();
      });
    });
  }
}

/* =============================================================
   10. BUDGET
============================================================= */
function onBudgetChange() {
  const budgetIn = document.getElementById('budgetIn');
  if (budgetIn) budget = parseFloat(budgetIn.value) || 0;
  saveData();
  updateBudget();
}

function updateBudget() {
  const items = lists.find(l => l.id === activeId)?.items || [];
  const spent = items.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);
  const rem   = budget - spent;
  const pct   = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  const spentV = document.getElementById('spentV');
  if (spentV) spentV.textContent = spent.toFixed(2) + currency;

  const remEl = document.getElementById('remV');
  if (remEl) {
    remEl.textContent = Math.abs(rem).toFixed(2) + currency;
    remEl.className   = 'bst-val ' + (rem < 0 ? 'err' : 'ok');
  }

  const fill = document.getElementById('pfill');
  if (fill) {
    fill.style.width = pct + '%';
    fill.className   = 'pfill' + (pct >= 100 ? ' e' : pct >= 80 ? ' w' : '');
  }

  const pbarWrap = document.getElementById('pbarWrap');
  if (pbarWrap) pbarWrap.setAttribute('aria-valuenow', Math.round(pct));

  const alertEl = document.getElementById('balert');
  if (alertEl) {
    if (rem < 0) {
      alertEl.classList.add('on');
      const balertTxt = document.getElementById('balertTxt');
      if (balertTxt) balertTxt.textContent = t('home.overbudget') + ' ' + Math.abs(rem).toFixed(2) + currency;
      if (cfg.sound !== false && !alertPlayed) {
        alertPlayed = true;
        playSound();
      }
    } else {
      alertEl.classList.remove('on');
      alertPlayed = false;
    }
  }

  const remLbl = document.getElementById('remLbl');
  if (remLbl) {
    remLbl.textContent = rem < 0 ? t('home.overbudget') : t('home.remaining');
  }

  const thresholds = cfg.thresholds || { 50: true, 80: true, 100: true };
  const roundedPct = Math.round(pct);
  for (let [threshold, enabled] of Object.entries(thresholds)) {
    if (enabled && roundedPct >= threshold && !triggeredThresholds[threshold]) {
      triggeredThresholds[threshold] = true;
      if (cfg.sound !== false) playSound();
      showSnack(`⚠️ ${t('home.threshold_reached')} ${threshold}%`);
    }
  }
  if (pct < 50) triggeredThresholds = {};
}

/* =============================================================
   11. CRUD ARTICLES
============================================================= */
function toggleCheck(itemId) {
  const item = getItem(itemId);
  if (!item) return;
  item.ck = !item.ck;
  saveData();
  renderHome();
}

function adjustQty(itemId, delta) {
  const item = getItem(itemId);
  if (!item) return;
  item.qty = Math.max(1, (item.qty || 1) + delta);
  saveData();
  renderHome();
}

function deleteItem(itemId) {
  const list = lists.find(l => l.id === activeId);
  if (!list) return;

  const idx = list.items.findIndex(i => i.id === itemId);
  if (idx < 0) return;

  const deleted = list.items.splice(idx, 1)[0];
  saveData();
  renderHome();

  showSnack(
    `"${deleted.text}" ${t('common.deleted')}`,
    t('common.undo'),
    () => {
      list.items.splice(idx, 0, deleted);
      saveData();
      renderHome();
    }
  );
}

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
  input.style.cssText = `width:60px; border:none; border-bottom:1.5px solid var(--p); background:transparent; text-align:right; font-size:13px; font-family:inherit; color:var(--tx);`;
  input.addEventListener('blur',    () => { if (item) { item.price = parseFloat(input.value) || 0; saveData(); renderHome(); } });
  input.addEventListener('keydown', e  => { if (e.key === 'Enter') input.blur(); });

  priceSpan.replaceWith(input);
  setTimeout(() => input.focus(), 10);
}

function getItem(itemId) {
  return lists.find(l => l.id === activeId)?.items.find(i => i.id === itemId);
}

/* =============================================================
   12. BOTTOM SHEET ARTICLE (AJOUT / MODIFICATION)
============================================================= */
function openAddItem() {
  if (!activeId) {
    showSnack(t('home.create_list_first'));
    return;
  }

  editItemId = null;
  currentQty = 1;

  const shItemTitle = document.getElementById('shItemTitle');
  if (shItemTitle) shItemTitle.textContent = t('item.add_title');
  const iSubmit = document.getElementById('iSubmit');
  // Le bouton iSubmit est maintenant une icône, on n'affiche plus de texte
  if (iSubmit) {
    iSubmit.setAttribute('aria-label', t('item.add_button'));
  }
  const iName = document.getElementById('iName');
  if (iName) iName.value = '';
  const iPrice = document.getElementById('iPrice');
  if (iPrice) iPrice.value = '';
  const iNote = document.getElementById('iNote');
  if (iNote) iNote.value = '';
  const iCat = document.getElementById('iCat');
  if (iCat) iCat.value = '';
  const qDisp = document.getElementById('qDisp');
  if (qDisp) qDisp.textContent = '1';
  const iNameHint = document.getElementById('iNameHint');
  if (iNameHint) iNameHint.textContent = '';
  
  const iUnit = document.getElementById('iUnit');
  if (iUnit) iUnit.value = 'pce';
  const fldPricePerUnit = document.getElementById('fldPricePerUnit');
  if (fldPricePerUnit) fldPricePerUnit.style.display = 'none';
  const iPricePerUnit = document.getElementById('iPricePerUnit');
  if (iPricePerUnit) iPricePerUnit.value = '';

  toggleMultiMode(false);
  stopBarcodeScan();

  buildQuickChips();

  openSheet('shItem');
  setTimeout(() => {
    const input = document.getElementById('iName');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 320);
}

function openEditItem(itemId) {
  const item = getItem(itemId);
  if (!item) return;

  editItemId = itemId;
  currentQty = item.qty || 1;

  const shItemTitle = document.getElementById('shItemTitle');
  if (shItemTitle) shItemTitle.textContent = t('item.edit_title');
  const iSubmit = document.getElementById('iSubmit');
  if (iSubmit) {
    iSubmit.setAttribute('aria-label', t('common.save'));
  }
  const iName = document.getElementById('iName');
  if (iName) iName.value = item.text;
  const iPrice = document.getElementById('iPrice');
  if (iPrice) iPrice.value = item.price || '';
  const iNote = document.getElementById('iNote');
  if (iNote) iNote.value = item.note || '';
  const iCat = document.getElementById('iCat');
  if (iCat) iCat.value = item.cat || '';
  const qDisp = document.getElementById('qDisp');
  if (qDisp) qDisp.textContent = currentQty;
  const iNameHint = document.getElementById('iNameHint');
  if (iNameHint) iNameHint.textContent = '';
  
  const iUnit = document.getElementById('iUnit');
  if (iUnit) iUnit.value = item.unit || 'pce';
  const iPricePerUnit = document.getElementById('iPricePerUnit');
  const fldPricePerUnit = document.getElementById('fldPricePerUnit');
  if (item.pricePerUnit) {
    if (iPricePerUnit) iPricePerUnit.value = item.pricePerUnit;
    if (fldPricePerUnit && (item.unit === 'kg' || item.unit === 'l' || item.unit === 'g' || item.unit === 'ml')) {
      fldPricePerUnit.style.display = 'block';
    }
  } else {
    if (fldPricePerUnit) fldPricePerUnit.style.display = 'none';
  }

  toggleMultiMode(false);
  stopBarcodeScan();

  buildQuickChips();

  openSheet('shItem');
}

function adjustSheetQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  const qDisp = document.getElementById('qDisp');
  if (qDisp) qDisp.textContent = currentQty;
}

function validateItemForm() {
  const iName = document.getElementById('iName');
  const raw = iName ? iName.value : '';
  const filled  = raw.trim().length > 0;
  const names   = parseNames(raw);
  const isMulti = names.length > 1;

  const iSubmit = document.getElementById('iSubmit');
  // Le bouton est maintenant une icône, on le désactive/active en changeant l'attribut disabled
  if (iSubmit) iSubmit.disabled = !filled;

  const hint = document.getElementById('iNameHint');
  if (hint) {
    if (isMulti) {
      hint.textContent = `${names.length} ${t('item.multi_hint')}`;
    } else {
      hint.textContent = '';
    }
  }

  toggleMultiMode(isMulti && !editItemId);
}

function toggleMultiMode(isMulti) {
  ['fldQty', 'fldPrice', 'fldNote', 'fldUnit', 'fldPricePerUnit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isMulti ? 'none' : 'block';
  });
}

function parseNames(raw) {
  return raw.split(',').map(n => n.trim()).filter(n => n.length > 0);
}

function confirmItem() {
  const iName = document.getElementById('iName');
  const raw = iName ? iName.value.trim() : '';
  if (!raw) return;

  const list  = lists.find(l => l.id === activeId);
  if (!list) return;

  const names   = parseNames(raw);
  const isMulti = names.length > 1 && !editItemId;
  const iCat = document.getElementById('iCat');
  const cat = iCat ? iCat.value : '';

  if (isMulti) {
    names.forEach((name, idx) => {
      list.items.push({
        id:    (Date.now() + idx).toString(),
        text:  name,
        qty:   1,
        price: 0,
        note:  '',
        cat,
        ck:    false,
        unit:  'pce',
        pricePerUnit: 0
      });
    });
    saveData();
    closeSheet();
    renderHome();
    showSnack(`${names.length} ${t('item.added_multiple')}`);
  } else {
    const iUnit = document.getElementById('iUnit');
    const unit = iUnit ? iUnit.value : 'pce';
    const iPricePerUnit = document.getElementById('iPricePerUnit');
    const pricePerUnit = iPricePerUnit ? parseFloat(iPricePerUnit.value) || 0 : 0;
    let price = 0;
    if (pricePerUnit > 0 && (unit === 'kg' || unit === 'l' || unit === 'g' || unit === 'ml')) {
      price = pricePerUnit * currentQty;
    } else {
      const iPrice = document.getElementById('iPrice');
      price = iPrice ? parseFloat(iPrice.value) || 0 : 0;
    }
    const iNote = document.getElementById('iNote');
    const note = iNote ? iNote.value.trim() : '';

    if (!editItemId && !isMulti) {
      const existing = list.items.find(i => i.text.toLowerCase() === names[0].toLowerCase());
      if (existing) {
        if (confirm(`"${names[0]}" ${t('item.already_exists_confirm')}`)) {
          existing.qty = (existing.qty || 1) + currentQty;
          saveData();
          closeSheet();
          renderHome();
          showSnack(t('item.quantity_increased'));
          return;
        }
      }
    }

    if (editItemId) {
      const item = list.items.find(i => i.id === editItemId);
      if (item) {
        item.text  = names[0];
        item.qty   = currentQty;
        item.price = price;
        item.pricePerUnit = pricePerUnit;
        item.unit  = unit;
        item.note  = note;
        item.cat   = cat;
      }
    } else {
      list.items.push({
        id:    Date.now().toString(),
        text:  names[0],
        qty:   currentQty,
        price: price,
        pricePerUnit: pricePerUnit,
        unit:  unit,
        note:  note,
        cat:   cat,
        ck:    false,
      });
    }

    saveData();
    closeSheet();
    renderHome();
    showSnack(editItemId ? t('item.modified') : t('item.added'));
  }
}

function buildQuickChips() {
  const container = document.getElementById('qChips');
  if (!container) return;
  container.innerHTML = QUICK_ITEMS_KEYS.map(key =>
    `<button class="chip" aria-label="${t(key)}">${t(key)}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input   = document.getElementById('iName');
      if (!input) return;
      const current = input.value.trim();
      input.value = current ? current + ', ' + chip.textContent : chip.textContent;
      input.dispatchEvent(new Event('input'));
    });
  });
}

/* =============================================================
   13. BOTTOM SHEET CRÉATION DE LISTE
============================================================= */
function openAddList() {
  const lName = document.getElementById('lName');
  if (lName) lName.value = '';
  const lEmoji = document.getElementById('lEmoji');
  if (lEmoji) lEmoji.value = '🛒';
  const lSubmit = document.getElementById('lSubmit');
  if (lSubmit) lSubmit.disabled = true;

  buildColorGrid('lCGrid', null, onListColorPick);
  const lColor = document.getElementById('lColor');
  if (lColor) lColor.value = '#3B82F6';

  openSheet('shList');
  setTimeout(() => {
    const input = document.getElementById('lName');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 320);
}

function validateListForm() {
  const lName = document.getElementById('lName');
  const lSubmit = document.getElementById('lSubmit');
  if (lSubmit) lSubmit.disabled = !(lName && lName.value.trim().length > 0);
}

function confirmList() {
  const lName = document.getElementById('lName');
  const name = lName ? lName.value.trim() : '';
  if (!name) return;

  const lEmoji = document.getElementById('lEmoji');
  const emoji = lEmoji ? lEmoji.value : '🛒';
  const lColor = document.getElementById('lColor');
  const color = lColor ? lColor.value : '#3B82F6';
  const id    = Date.now().toString();

  lists.push({ id, name, emoji, color, items: [], mapImage: null, location: null });

  if (!activeId) activeId = id;

  saveData();
  closeSheet();
  renderLists();
  showSnack(`${emoji} ${name} ${t('lists.created')}`);
}

function buildEmojiChips() {
  const container = document.getElementById('eChips');
  if (!container) {
    console.warn('eChips not found');
    return;
  }
  container.innerHTML = EMOJIS.map(e =>
    `<button class="chip" aria-label="${t('lists.emoji_label')} ${e}">${e}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const lEmoji = document.getElementById('lEmoji');
      if (lEmoji) lEmoji.value = chip.textContent;
    });
  });
}

/* =============================================================
   14. GESTION DES LISTES + CARTE MAGASIN
============================================================= */
function pickList(listId) {
  activeId = listId;
  saveData();
  goTo('home');
}

function renameList(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  const newName = prompt(t('lists.rename_prompt'), list.name);
  if (newName?.trim()) {
    list.name = newName.trim();
    saveData();
    renderLists();
    if (listId === activeId) {
      const htitle = document.getElementById('htitle');
      const aListName = document.getElementById('aListName');
      if (htitle) htitle.textContent = list.name;
      if (aListName) aListName.textContent = list.name;
    }
  }
}

function removeList(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  if (!confirm(t('lists.delete_confirm', { name: list.name }))) return;

  lists    = lists.filter(l => l.id !== listId);
  if (activeId === listId) activeId = lists[0]?.id ?? null;

  saveData();
  renderLists();
  renderHome();
  showSnack(t('lists.deleted'));
}

function captureMap(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      openImageEditor(readerEvent.target.result, listId);
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

function viewMap() {
  const list = lists.find(l => l.id === activeId);
  if (!list || !list.mapImage) return;
  const modal = document.getElementById('logoModal');
  if (modal) {
    const img = modal.querySelector('img');
    if (img) img.src = list.mapImage;
    modal.style.display = 'flex';
  }
}

function deleteMap() {
  const list = lists.find(l => l.id === activeId);
  if (!list || !list.mapImage) return;
  if (!confirm(t('home.delete_map_confirm'))) return;
  list.mapImage = null;
  saveData();
  renderHome();
  showSnack(t('home.map_deleted'));
}

/* =============================================================
   15. PARTAGE / EXPORT .TXT (partage texte lisible)
============================================================= */
function buildTxtContent(list) {
  const sep  = '─'.repeat(36);
  const date = new Date().toLocaleDateString(cfg.lang || 'fr', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let txt = '';
  txt += `${list.emoji || '🛒'}  ${list.name.toUpperCase()}\n`;
  txt += `${sep}\n`;
  txt += `📅 ${date}\n\n`;

  const groups = {};
  list.items.forEach(item => {
    const key = item.cat || t('item.misc');
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  Object.entries(groups).forEach(([cat, items]) => {
    if (cat !== t('item.misc') || Object.keys(groups).length > 1) {
      txt += `\n▸ ${cat}\n`;
    }
    items.forEach(item => {
      const check    = item.ck ? '✓' : '☐';
      const qty      = (item.qty || 1) > 1 ? `  x${item.qty}` : '    ';
      const price    = item.price ? `  —  ${(item.price * (item.qty || 1)).toFixed(2)} ${currency}` : '';
      const note     = item.note ? `  (${item.note})` : '';
      const name     = item.text.padEnd(22, ' ');
      txt += `  ${check}  ${name}${qty}${price}${note}\n`;
    });
  });

  const total = list.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const done  = list.items.filter(i => i.ck).length;

  txt += `\n${sep}\n`;
  txt += `✅ ${t('home.checked')} : ${done} / ${list.items.length} ${list.items.length > 1 ? t('home.article_plural') : t('home.article_singular')}\n`;
  if (total > 0) txt += `💰 ${t('home.total')} : ${total.toFixed(2)} ${currency}\n`;
  txt += `\n📱 ${t('app_name')}\n`;
  txt += `\nGénéré par Courses Malin - https://liste-coursesv2.netlify.app\n`;
  return txt;
}

function shareList() {
  const list = lists.find(l => l.id === activeId);
  if (!list) { showSnack(t('share.no_list')); return; }
  if (!list.items.length) { showSnack(t('share.empty_list')); return; }

  const content = buildTxtContent(list);

  if (navigator.share) {
    navigator.share({
      title: list.name,
      text: content
    }).catch(() => {
      copyToClipboard(content, list.name);
    });
  } else {
    copyToClipboard(content, list.name);
  }
}

function copyToClipboard(text, listName) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showSnack(t('share.copied'));
    }).catch(() => {
      downloadTxt(text, listName);
    });
  } else {
    downloadTxt(text, listName);
  }
}

function downloadTxt(content, listName) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${listName.replace(/[^a-z0-9]/gi, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* =============================================================
   16. EXPORT CSV (pour le bouton Exporter)
============================================================= */
function downloadCSV(content, listName) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${listName.replace(/[^a-z0-9]/gi, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* =============================================================
   17. SON
============================================================= */
function playSound() {
  stopSound();
  const choice = document.getElementById('soundSel')?.value || 'A';
  audioInstance = new Audio(`assets/sound/Alarm${choice}.mp3`);
  audioInstance.play().catch(playFallbackBeep);
}

function stopSound() {
  if (audioInstance) {
    audioInstance.pause();
    audioInstance.currentTime = 0;
    audioInstance = null;
  }
}

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
  } catch (e) { console.warn('Web Audio API indisponible :', e); }
}

/* =============================================================
   18. OVERLAY & SHEETS
============================================================= */
function openSheet(sheetId) {
  openSheetId = sheetId;
  const ovl = document.getElementById('ovl');
  if (ovl) ovl.classList.add('on');
  const sheet = document.getElementById(sheetId);
  if (sheet) {
    sheet.classList.add('on');
    sheet.setAttribute('aria-hidden', 'false');
  }
}

function closeSheet() {
  stopBarcodeScan();
  if (openSheetId) {
    const sheet = document.getElementById(openSheetId);
    if (sheet) {
      sheet.classList.remove('on');
      sheet.setAttribute('aria-hidden', 'true');
    }
  }
  const ovl = document.getElementById('ovl');
  if (ovl) ovl.classList.remove('on');
  openSheetId = null;
}

/* =============================================================
   19. SCAN DE CODE-BARRES (avec html5-qrcode + Open Food Facts)
============================================================= */
function startBarcodeScan() {
  if (html5QrCode) return;

  const container = document.getElementById('scannerContainer');
  if (!container) return;
  container.style.display = 'block';

  html5QrCode = new Html5Qrcode("qr-reader");
  const qrCodeSuccessCallback = (decodedText) => {
    if (multiScanMode) {
      fetchProductFromBarcodeMultiple(decodedText);
    } else {
      stopBarcodeScan();
      fetchProductFromBarcode(decodedText);
    }
  };
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode.start(
    { facingMode: "environment" },
    config,
    qrCodeSuccessCallback,
    () => {}
  ).catch(err => {
    showSnack(t('item.camera_error'));
    console.error(err);
    container.style.display = 'none';
    html5QrCode = null;
  });
}

function stopBarcodeScan() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      html5QrCode.clear();
      html5QrCode = null;
    }).catch(err => console.warn(err));
  }
  const scannerContainer = document.getElementById('scannerContainer');
  if (scannerContainer) scannerContainer.style.display = 'none';
  const scanResultPanel = document.getElementById('scanResultPanel');
  if (scanResultPanel) scanResultPanel.style.display = 'none';
}

function fetchProductFromBarcode(barcode) {
  showSnack(t('item.searching') + ' ' + barcode);
  fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 1) {
        const product = data.product;
        const iName = document.getElementById('iName');
        if (iName) iName.value = product.product_name || '';

        const categories = product.categories_tags || [];
        let matchedCat = '';
        for (let cat of categories) {
          const catLower = cat.toLowerCase();
          if (catLower.includes('fruit') || catLower.includes('vegetable')) matchedCat = '🥦 Fruits & Légumes';
          else if (catLower.includes('meat') || catLower.includes('fish')) matchedCat = '🥩 Viandes & Poissons';
          else if (catLower.includes('dairy') || catLower.includes('milk')) matchedCat = '🥛 Produits Laitiers';
          else if (catLower.includes('bread') || catLower.includes('bakery')) matchedCat = '🥖 Boulangerie';
          else if (catLower.includes('drink') || catLower.includes('beverage')) matchedCat = '🧃 Boissons';
          else if (catLower.includes('frozen')) matchedCat = '🍦 Surgelés';
          else if (catLower.includes('heart')) matchedCat = '💕 Love';
          else if (catLower.includes('baby')) matchedCat = '🤬 SaMéreList';
          else if (catLower.includes('sheet')) matchedCat = '🖕 Sheet List';
          else if (catLower.includes('magic')) matchedCat = '🧙‍♂️ Magic List';
          if (matchedCat) break;
        }
        if (matchedCat) {
          const iCat = document.getElementById('iCat');
          if (iCat) iCat.value = matchedCat;
        }

        if (product.brands) {
          const iNote = document.getElementById('iNote');
          if (iNote) iNote.value = product.brands;
        }

        const iNameEl = document.getElementById('iName');
        if (iNameEl) iNameEl.dispatchEvent(new Event('input'));
        showSnack(t('item.found'));
      } else {
        showSnack(t('item.not_found'));
      }
    })
    .catch(() => {
      showSnack(t('item.api_error'));
    });
}

function fetchProductFromBarcodeMultiple(barcode) {
  showSnack(t('item.searching'));
  fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 1) {
        lastScannedBarcode = barcode;
        lastScannedProductData = data.product;
        showScanResult(data.product);
      } else {
        lastScannedBarcode = barcode;
        lastScannedProductData = { product_name: `${t('item.code')}: ${barcode}`, brands: '' };
        showScanResult({ product_name: `${t('item.code')}: ${barcode}`, brands: '' });
      }
    })
    .catch(() => {
      showSnack(t('item.api_error'));
    });
}

function showScanResult(product) {
  const panel = document.getElementById('scanResultPanel');
  if (!panel) return;
  const scanProductName = document.getElementById('scanProductName');
  if (scanProductName) scanProductName.textContent = product.product_name || t('item.unknown');
  panel.style.display = 'block';
}

function addProductFromScan(product) {
  const list = lists.find(l => l.id === activeId);
  if (!list) return;

  const existing = list.items.find(item => 
    item.barcode === lastScannedBarcode || 
    (product.product_name && item.text.toLowerCase() === product.product_name.toLowerCase())
  );
  if (existing) {
    if (confirm(`"${existing.text}" ${t('item.already_exists_confirm')}`)) {
      existing.qty = (existing.qty || 1) + 1;
      saveData();
      renderHome();
      showSnack(t('item.quantity_increased'));
    }
    return;
  }

  let cat = '';
  const categories = product.categories_tags || [];
  for (let c of categories) {
    const cl = c.toLowerCase();
    if (cl.includes('fruit') || cl.includes('vegetable')) cat = '🥦 Fruits & Légumes';
    else if (cl.includes('meat') || cl.includes('fish')) cat = '🥩 Viandes & Poissons';
    else if (cl.includes('dairy') || cl.includes('milk')) cat = '🥛 Produits Laitiers';
    else if (cl.includes('bread') || cl.includes('bakery')) cat = '🥖 Boulangerie';
    else if (cl.includes('drink') || cl.includes('beverage')) cat = '🧃 Boissons';
    else if (cl.includes('frozen')) cat = '🍦 Surgelés';
    else if (cl.includes('heart')) cat = '💕 Love';
    else if (cl.includes('baby')) cat = '🤬 SaMéreList';
    else if (cl.includes('sheet')) cat = '🖕 Sheet List';
    else if (cl.includes('magic')) cat = '🧙‍♂️ Magic List';
    if (cat) break;
  }

  list.items.push({
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
    text: product.product_name || t('item.product'),
    qty: 1,
    price: 0,
    note: product.brands || '',
    cat: cat,
    ck: false,
    barcode: lastScannedBarcode,
    unit: 'pce',
    pricePerUnit: 0
  });
  saveData();
  renderHome();
  showSnack(t('item.added'));
}

/* =============================================================
   20. ÉDITEUR D'IMAGE (recadrage, rotation)
============================================================= */
function openImageEditor(imageDataUrl, listId) {
  currentListIdForImage = listId;
  const img = document.getElementById('imageToEdit');
  if (!img) return;
  img.src = imageDataUrl;
  
  if (cropper) cropper.destroy();
  cropper = new Cropper(img, {
    aspectRatio: NaN,
    viewMode: 1,
    autoCropArea: 1,
    responsive: true,
    background: false,
  });

  openSheet('shImageEditor');
}

/* =============================================================
   21. MODAL LOGO
============================================================= */
function showLogoModal() {
  const modal = document.getElementById('logoModal');
  if (modal) modal.style.display = 'flex';
}

function closeLogoModal() {
  const modal = document.getElementById('logoModal');
  if (modal) modal.style.display = 'none';
}

/* =============================================================
   22. SNACKBAR
============================================================= */
function showSnack(message, action, cb) {
  const el = document.getElementById('snk');
  if (!el) return;
  snkCallback = cb || null;
  el.innerHTML = action
    ? `${esc(message)}<button onclick="triggerSnackAction()" style="background:none;border:none;color:var(--p);font-weight:700;cursor:pointer;font-family:inherit;font-size:14px;margin-left:8px">${esc(action)}</button>`
    : esc(message);
  el.classList.add('on');
  clearTimeout(snkTimer);
  snkTimer = setTimeout(() => el.classList.remove('on'), 4000);
}

function triggerSnackAction() {
  if (snkCallback) { snkCallback(); snkCallback = null; }
  const el = document.getElementById('snk');
  if (el) el.classList.remove('on');
}

/* =============================================================
   23. UTILITAIRES
============================================================= */
function esc(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/* =============================================================
   24. EXPORT / IMPORT CSV + PARTAGE TEXTE + IMPORT LISTE
============================================================= */

function showListSelector(title, callback, filter = () => true, options = {}) {
  const container = document.getElementById('exportListCheckboxes');
  if (!container) return;
  const filteredLists = lists.filter(filter);
  if (filteredLists.length === 0) {
    showSnack(t('import.no_lists'));
    return;
  }

  let html = '';
  filteredLists.forEach(list => {
    html += `
      <div style="margin-bottom: 10px;">
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="export-checkbox" data-list-id="${list.id}" ${options.checked ? 'checked' : ''}>
          <span>${list.emoji} ${esc(list.name)} (${list.items.length} ${list.items.length > 1 ? t('home.article_plural') : t('home.article_singular')})</span>
        </label>
      </div>
    `;
  });
  container.innerHTML = html;

  const shExportTitle = document.getElementById('shExportTitle');
  if (shExportTitle) shExportTitle.textContent = title;
  const btnCancelExport = document.getElementById('btnCancelExport');
  if (btnCancelExport) btnCancelExport.textContent = t('common.cancel');
  const btnConfirmExport = document.getElementById('btnConfirmExport');
  if (btnConfirmExport) btnConfirmExport.textContent = t('common.confirm');
  
  const oldHandler = btnConfirmExport ? btnConfirmExport.onclick : null;
  if (btnConfirmExport) {
    btnConfirmExport.onclick = () => {
      callback();
    };
  }
  openSheet('shExport');

  const closeHandler = () => {
    if (btnConfirmExport) btnConfirmExport.onclick = oldHandler;
    if (shExportTitle) shExportTitle.textContent = t('export.title');
    const sheet = document.getElementById('shExport');
    if (sheet) sheet.removeEventListener('sheetclosed', closeHandler);
  };
  const sheet = document.getElementById('shExport');
  if (sheet) sheet.addEventListener('sheetclosed', closeHandler, { once: true });
}

function showExportSelector() {
  showListSelector(t('export.title'), confirmExport, () => true, { checked: true });
}

function confirmExport() {
  const checkboxes = document.querySelectorAll('.export-checkbox');
  const selectedIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) selectedIds.push(cb.dataset.listId);
  });

  if (selectedIds.length === 0) {
    showSnack(t('export.none_selected'));
    return;
  }

  const selectedLists = lists.filter(list => selectedIds.includes(list.id));

  let csvContent = "liste;article;quantite;prix;categorie;note;coché\n";
  selectedLists.forEach(list => {
    list.items.forEach(item => {
      const ligne = [
        `"${list.name}"`,
        `"${item.text}"`,
        item.qty || 1,
        item.price || 0,
        `"${item.cat || ''}"`,
        `"${item.note || ''}"`,
        item.ck ? 1 : 0
      ].join(';');
      csvContent += ligne + '\n';
    });
  });
  csvContent += "\n# Généré par Courses Malin - https://liste-coursesv2.netlify.app\n";

  let baseName = 'mes_listes';
  if (selectedLists.length === 1) {
    baseName = selectedLists[0].name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  const date = new Date().toISOString().slice(0,10);
  const filename = `${baseName}_${date}.csv`;

  downloadCSV(csvContent, filename);
  closeSheet();
}

// NOUVELLE VERSION DE importListsFromCSV AVEC GESTION DES DOUBLONS ET FUSION
function importListsFromCSV() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const csv = readerEvent.target.result;
      const lines = csv.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
      if (lines.length < 2) {
        showSnack(t('import.empty_file'));
        return;
      }

      const header = lines[0].split(';').map(s => s.replace(/^"|"$/g, '').trim());
      if (header.length < 7) {
        showSnack(t('import.invalid_format'));
        return;
      }

      // Organiser les données importées par nom de liste
      const importedListsMap = new Map(); // clé = nom de liste, valeur = tableau d'items
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(s => s.replace(/^"|"$/g, '').trim());
        if (cols.length < 7) continue;
        const listName = cols[0];
        if (!listName) continue;
        if (!importedListsMap.has(listName)) {
          importedListsMap.set(listName, []);
        }
        const item = {
          text: cols[1],
          qty: parseInt(cols[2]) || 1,
          price: parseFloat(cols[3]) || 0,
          cat: cols[4] || '',
          note: cols[5] || '',
          ck: cols[6] === '1' ? true : false,
          unit: 'pce',
          pricePerUnit: 0
        };
        importedListsMap.get(listName).push(item);
      }

      if (importedListsMap.size === 0) {
        showSnack(t('import.no_lists_found'));
        return;
      }

      // Pour chaque liste importée, vérifier si elle existe déjà
      const processNextList = (index, listsToProcess, applyToAllReplace) => {
        if (index >= listsToProcess.length) {
          saveData();
          renderAll();
          goTo('home');
          showSnack(t('import.complete', { count: listsToProcess.reduce((acc, [_, items]) => acc + items.length, 0) }));
          return;
        }

        const [listName, items] = listsToProcess[index];
        const existingList = lists.find(l => l.name === listName);

        if (!existingList) {
          // Créer une nouvelle liste
          const newList = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: listName,
            emoji: '🛒',
            color: '#3B82F6',
            items: items.map(item => ({
              ...item,
              id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            })),
            mapImage: null,
            location: null
          };
          lists.push(newList);
          processNextList(index + 1, listsToProcess, applyToAllReplace);
        } else {
          // Liste existante : demander quoi faire
          if (applyToAllReplace === true) {
            // Remplacer
            existingList.items = items.map(item => ({
              ...item,
              id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            }));
            processNextList(index + 1, listsToProcess, true);
          } else if (applyToAllReplace === false) {
            // Fusionner (ignorer les doublons en demandant)
            mergeItems(existingList, items, index, listsToProcess, false, () => {
              processNextList(index + 1, listsToProcess, false);
            });
          } else {
            // Première fois pour cette liste : demander
            const msg = t('import.list_exists', { name: listName });
            if (confirm(msg + ' ' + t('import.replace_confirm'))) {
              // Remplacer
              existingList.items = items.map(item => ({
                ...item,
                id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
              }));
              processNextList(index + 1, listsToProcess, null);
            } else if (confirm(t('import.merge_confirm'))) {
              // Fusionner
              mergeItems(existingList, items, index, listsToProcess, false, () => {
                processNextList(index + 1, listsToProcess, null);
              });
            } else {
              // Ignorer cette liste
              processNextList(index + 1, listsToProcess, null);
            }
          }
        }
      };

      const mergeItems = (targetList, importedItems, listIndex, listsToProcess, applyAllMerge, callback) => {
        // Pour chaque article importé, vérifier s'il existe déjà
        let i = 0;
        const processNextItem = () => {
          if (i >= importedItems.length) {
            callback();
            return;
          }
          const importedItem = importedItems[i];
          const existingItem = targetList.items.find(it => it.text.toLowerCase() === importedItem.text.toLowerCase());

          if (!existingItem) {
            // Ajouter
            targetList.items.push({
              ...importedItem,
              id: Date.now() + '-' + Math.random().toString(36).substr(2, 9)
            });
            i++;
            processNextItem();
          } else {
            // Doublon
            if (applyAllMerge) {
              // Fusionner (augmenter quantité)
              existingItem.qty = (existingItem.qty || 1) + (importedItem.qty || 1);
              i++;
              processNextItem();
            } else {
              const msg = t('import.duplicate_message', { name: importedItem.text });
              if (confirm(msg)) {
                // Demander si on applique à tous
                const applyAll = confirm(t('import.duplicate_apply_all'));
                existingItem.qty = (existingItem.qty || 1) + (importedItem.qty || 1);
                i++;
                if (applyAll) {
                  // Appliquer à tous les suivants sans demander
                  mergeItems(targetList, importedItems.slice(i), listIndex, listsToProcess, true, callback);
                  return;
                } else {
                  processNextItem();
                }
              } else {
                // Ignorer
                i++;
                processNextItem();
              }
            }
          }
        };
        processNextItem();
      };

      const listsToProcess = Array.from(importedListsMap.entries());
      processNextList(0, listsToProcess, null);
    };
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
}

function showTextExportSelector() {
  showListSelector(t('share_text.title'), confirmTextExport, () => true, { checked: true });
}

function confirmTextExport() {
  const checkboxes = document.querySelectorAll('.export-checkbox');
  const selectedIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) selectedIds.push(cb.dataset.listId);
  });

  if (selectedIds.length === 0) {
    showSnack(t('export.none_selected'));
    return;
  }

  const selectedLists = lists.filter(list => selectedIds.includes(list.id));
  let fullText = '';
  selectedLists.forEach(list => {
    fullText += buildTxtContent(list) + '\n\n---\n\n';
  });

  const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const baseName = selectedLists.length === 1 ? selectedLists[0].name : 'listes';
  a.download = `${baseName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.txt`;
  a.href = url;
  a.click();
  URL.revokeObjectURL(url);

  closeSheet();
  showSnack(t('share_text.downloaded'));
}

function showImportToListSelector() {
  if (!activeId) {
    showSnack(t('import.no_active_list'));
    return;
  }
  showListSelector(t('import.title'), confirmImportToList, list => list.id !== activeId, { checked: false });
}

function confirmImportToList() {
  const checkboxes = document.querySelectorAll('.export-checkbox');
  const selectedIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) selectedIds.push(cb.dataset.listId);
  });

  if (selectedIds.length === 0) {
    showSnack(t('import.none_selected'));
    return;
  }

  const targetList = lists.find(l => l.id === activeId);
  if (!targetList) return;

  const sourceLists = lists.filter(l => selectedIds.includes(l.id));
  let addedCount = 0;
  let itemsToProcess = [];

  sourceLists.forEach(source => {
    source.items.forEach(item => {
      itemsToProcess.push({
        item: item,
        sourceListName: source.name
      });
    });
  });

  processNextItem(itemsToProcess, 0, targetList, addedCount, false);
}

function processNextItem(items, index, targetList, addedCount, applyToAll) {
  if (index >= items.length) {
    if (addedCount > 0) {
      saveData();
      renderHome();
      showSnack(t('import.complete', { count: addedCount }));
    } else {
      showSnack(t('import.nothing_added'));
    }
    closeSheet();
    return;
  }

  const { item } = items[index];
  const existing = targetList.items.find(i => i.text.toLowerCase() === item.text.toLowerCase());

  if (!existing) {
    targetList.items.push({
      ...item,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5)
    });
    processNextItem(items, index + 1, targetList, addedCount + 1, applyToAll);
  } else {
    if (applyToAll) {
      existing.qty = (existing.qty || 1) + (item.qty || 1);
      processNextItem(items, index + 1, targetList, addedCount + 1, applyToAll);
    } else {
      const msg = t('import.duplicate_message', { name: item.text });
      if (confirm(msg)) {
        existing.qty = (existing.qty || 1) + (item.qty || 1);
        const applyAll = confirm(t('import.duplicate_apply_all'));
        processNextItem(items, index + 1, targetList, addedCount + 1, applyAll);
      } else {
        processNextItem(items, index + 1, targetList, addedCount, false);
      }
    }
  }
}

/* =============================================================
   25. SWIPE POUR CHANGER DE LISTE
============================================================= */
function initSwipe() {
  const container = document.getElementById('activeListInfo');
  if (!container) return;
  let touchstartX = 0;
  let touchendX = 0;
  
  container.addEventListener('touchstart', e => {
    touchstartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  container.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const threshold = 50;
    if (touchendX < touchstartX - threshold) {
      // swipe gauche -> liste suivante
      changeList(1);
    } else if (touchendX > touchstartX + threshold) {
      // swipe droite -> liste précédente
      changeList(-1);
    }
  }
}

function changeList(direction) {
  if (lists.length === 0) return;
  const currentIndex = lists.findIndex(l => l.id === activeId);
  if (currentIndex === -1) return;
  let newIndex = currentIndex + direction;
  if (newIndex < 0) newIndex = lists.length - 1;
  if (newIndex >= lists.length) newIndex = 0;
  pickList(lists[newIndex].id);
}

/* =============================================================
   26. QR CODE SUR LE TITRE
============================================================= */
function showQRCode() {
  const url = window.location.href; // ou une URL fixe
  QRCode.toDataURL(url, { width: 300 }, (err, url) => {
    if (err) {
      showSnack('Erreur génération QR');
      return;
    }
    const modal = document.getElementById('qrModal');
    const img = document.getElementById('qrImage');
    img.src = url;
    modal.style.display = 'flex';
  });
}

/* =============================================================
   27. ATTACHEMENT DES ÉCOUTEURS
============================================================= */
function attachListeners() {
  const getEl = (id) => document.getElementById(id);

  // Header
  getEl('btnBack')?.addEventListener('click', () => goTo('home'));
  getEl('headerLogo')?.addEventListener('click', showLogoModal);
  getEl('btnAdd')?.addEventListener('click', openAddItem);
  getEl('htitle')?.addEventListener('click', showQRCode);

  // Navigation
  getEl('t-home')?.addEventListener('click', () => goTo('home'));
  getEl('t-lists')?.addEventListener('click', () => goTo('lists'));
  getEl('t-settings')?.addEventListener('click', () => goTo('settings'));

  // FABs
  getEl('fab')?.addEventListener('click', openAddItem);
  getEl('fab-list')?.addEventListener('click', openAddList);

  // Overlay
  getEl('ovl')?.addEventListener('click', closeSheet);

  // Accueil
  getEl('budgetIn')?.addEventListener('change', onBudgetChange);
  getEl('searchIn')?.addEventListener('input', renderHome);
  getEl('btnShare')?.addEventListener('click', shareList);
  getEl('btnImportToList')?.addEventListener('click', showImportToListSelector);
  getEl('changeMapBtn')?.addEventListener('click', () => {
    if (activeId) captureMap(activeId);
  });
  getEl('deleteMapBtn')?.addEventListener('click', deleteMap);
  getEl('mapThumb')?.addEventListener('click', viewMap);
  getEl('locateStoreBtn')?.addEventListener('click', () => {
    if (activeId) locateStore(activeId);
  });
  getEl('routeStoreBtn')?.addEventListener('click', () => {
    const list = lists.find(l => l.id === activeId);
    if (list && list.location) {
      const { lat, lon } = list.location;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
      window.open(url, '_blank');
    } else {
      showSnack(t('home.no_location'));
    }
  });

  // État vide
  getEl('emptyState')?.addEventListener('click', () => {
    if (lists.length === 0) {
      goTo('lists');
    } else {
      openAddItem();
    }
  });

  // Sheet Article
  getEl('iName')?.addEventListener('input', validateItemForm);
  getEl('qtyMinus')?.addEventListener('click', () => adjustSheetQty(-1));
  getEl('qtyPlus')?.addEventListener('click', () => adjustSheetQty(+1));
  getEl('iSubmit')?.addEventListener('click', confirmItem); // le bouton icône
  getEl('iUnit')?.addEventListener('change', function() {
    const unit = this.value;
    const pricePerUnitField = document.getElementById('fldPricePerUnit');
    if (pricePerUnitField) {
      pricePerUnitField.style.display = (unit === 'kg' || unit === 'l' || unit === 'g' || unit === 'ml') ? 'block' : 'none';
    }
  });
  getEl('btnManageCategories')?.addEventListener('click', () => {
    closeSheet(); // ferme shItem
    openCategoryEditor(-1);
  });

  // Toggle scan multiple
  getEl('multiScanToggle')?.addEventListener('click', () => {
    multiScanMode = !multiScanMode;
    const tog = document.getElementById('multiScanToggle');
    if (tog) {
      tog.classList.toggle('on', multiScanMode);
      tog.setAttribute('aria-checked', multiScanMode);
    }
  });

  // Scan
  getEl('btnScanBarcode')?.addEventListener('click', startBarcodeScan);
  getEl('btnStopScan')?.addEventListener('click', stopBarcodeScan);

  // Boutons du panneau de résultat de scan
  getEl('scanAddBtn')?.addEventListener('click', () => {
    if (lastScannedProductData) {
      addProductFromScan(lastScannedProductData);
    }
    const panel = document.getElementById('scanResultPanel');
    if (panel) panel.style.display = 'none';
  });
  getEl('scanIgnoreBtn')?.addEventListener('click', () => {
    const panel = document.getElementById('scanResultPanel');
    if (panel) panel.style.display = 'none';
  });
  getEl('scanStopBtn')?.addEventListener('click', () => {
    stopBarcodeScan();
    const panel = document.getElementById('scanResultPanel');
    if (panel) panel.style.display = 'none';
  });

  // Speech
  getEl('btnSpeech')?.addEventListener('click', startListening);

  // Sheet Liste
  getEl('lName')?.addEventListener('input', validateListForm);
  getEl('lSubmit')?.addEventListener('click', confirmList);

  // Mes Listes
  getEl('btnNewList')?.addEventListener('click', openAddList);

  // Export/Import
  getEl('btnExportLists')?.addEventListener('click', showExportSelector);
  getEl('btnImportLists')?.addEventListener('click', importListsFromCSV);
  getEl('btnShareListsText')?.addEventListener('click', showTextExportSelector);

  // Bouton Annuler du sheet Export
  getEl('btnCancelExport')?.addEventListener('click', closeSheet);

  // Réglages
  getEl('darkTog')?.addEventListener('click', toggleDark);
  getEl('soundTog')?.addEventListener('click', toggleSound);
  getEl('soundSel')?.addEventListener('change', saveConfig);
  getEl('btnPlaySound')?.addEventListener('click', playSound);
  getEl('btnStopSound')?.addEventListener('click', stopSound);
  getEl('btnReset')?.addEventListener('click', resetAll);
  getEl('btnHelp')?.addEventListener('click', () => goTo('help'));

  // Gestion des catégories
  getEl('btnCancelCategoryEdit')?.addEventListener('click', cancelCategoryEdit);
  getEl('btnSaveCategory')?.addEventListener('click', saveCategory);

  // Éditeur d'image
  getEl('btnRotateLeft')?.addEventListener('click', () => {
    if (cropper) cropper.rotate(-90);
  });
  getEl('btnRotateRight')?.addEventListener('click', () => {
    if (cropper) cropper.rotate(90);
  });
  getEl('btnFlipHorizontal')?.addEventListener('click', () => {
    if (cropper) {
      const scaleX = cropper.getData().scaleX || 1;
      cropper.scaleX(-scaleX);
    }
  });
  getEl('btnFlipVertical')?.addEventListener('click', () => {
    if (cropper) {
      const scaleY = cropper.getData().scaleY || 1;
      cropper.scaleY(-scaleY);
    }
  });
  getEl('btnCancelImageEdit')?.addEventListener('click', () => {
    closeSheet();
    if (cropper) cropper.destroy();
    cropper = null;
  });
  getEl('btnSaveImageEdit')?.addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas();
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const list = lists.find(l => l.id === currentListIdForImage);
    if (list) {
      list.mapImage = croppedDataUrl;
      saveData();
      if (currentListIdForImage === activeId) renderHome();
      renderLists();
      showSnack(t('home.map_saved'));
    }
    closeSheet();
    if (cropper) cropper.destroy();
    cropper = null;
  });

  // Swipe pour fermer les sheets
  let touchStartY = 0;
  document.querySelectorAll('.sheet').forEach(sheet => {
    sheet.addEventListener('touchstart', e => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    sheet.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - touchStartY > 80) closeSheet();
    }, { passive: true });
  });

  // Touche Échap
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openSheetId) closeSheet();
  });

  // Modal logo
  getEl('logoModal')?.addEventListener('click', closeLogoModal);
}

/* =============================================================
  DÉMARRAGE
============================================================= */
document.addEventListener('DOMContentLoaded', init);