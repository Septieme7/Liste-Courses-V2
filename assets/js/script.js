/* =============================================================
   COURSES MALIN · script.js
   Version finale avec édition d'image, scan multiple, export/import CSV,
   internationalisation, unités, glisser-déposer, notes vocales, géolocalisation,
   alertes de budget personnalisées.
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

const QUICK_ITEMS = [
  'Pain', 'Lait', 'Œufs', 'Beurre', 'Fromage', 'Yaourt',
  'Eau', 'Pommes', 'Bananes', 'Poulet', 'Pâtes', 'Riz',
  'Café', 'Jus', 'Farine', 'Sucre', 'Sel', 'Huile', 'Dinosaure', 'Licorne', 'Chocolat', 'Glaces', 'Saucisses', 'Poisson', 'Carottes', 'Tomates',
];

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
let triggeredThresholds = {}; // pour les alertes de seuils

// Scan
let html5QrCode = null;
let multiScanMode = false;
let lastScannedBarcode = null;
let lastScannedProductData = null;

// Éditeur d'image
let cropper = null;
let currentListIdForImage = null;

/* =============================================================
   3. INITIALISATION
============================================================= */
function init() {
  loadData();
  buildColorGrid('cGrid',  cfg.color || 'blue', onMainColorPick);
  buildColorGrid('lCGrid', null,                onListColorPick);
  buildEmojiChips();
  buildQuickChips();
  applyTheme();
  syncSettingsUI();
  attachListeners();

  // Charger la langue avant le premier rendu
  if (cfg.lang) {
    loadLanguage(cfg.lang).then(() => {
      renderAll();
    });
  } else {
    renderAll();
  }

  // Initialiser les seuils d'alerte
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

  document.getElementById('budgetIn').value = budget;
  
  window.cfg = cfg; // pour i18n.js
}

function saveData() {
  localStorage.setItem(LS_LISTS,  JSON.stringify(lists));
  localStorage.setItem(LS_BUDGET, budget);
  localStorage.setItem(LS_ACTIVE, activeId ?? '');
}

function saveConfig() {
  cfg.soundChoice = document.getElementById('soundSel').value;
  cfg.thresholds = {
    50: document.getElementById('threshold50')?.checked || false,
    80: document.getElementById('threshold80')?.checked || false,
    100: document.getElementById('threshold100')?.checked || false
  };
  localStorage.setItem(LS_CFG, JSON.stringify(cfg));
}

function resetAll() {
  if (!confirm('Supprimer TOUTES les données de l\'application ?')) return;
  localStorage.clear();
  location.reload();
}

/* =============================================================
   5. THÈME & COULEURS
============================================================= */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', cfg.dark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-color', cfg.color || 'blue');
}

function toggleDark() {
  cfg.dark = !cfg.dark;
  const tog = document.getElementById('darkTog');
  tog.classList.toggle('on', cfg.dark);
  tog.setAttribute('aria-checked', cfg.dark);
  saveConfig();
  applyTheme();
}

function toggleSound() {
  cfg.sound = (cfg.sound === false) ? true : false;
  const tog = document.getElementById('soundTog');
  tog.classList.toggle('on', cfg.sound !== false);
  tog.setAttribute('aria-checked', cfg.sound !== false);
  saveConfig();
}

function buildColorGrid(gridId, active, callback) {
  const el = document.getElementById(gridId);
  if (!el) return;

  el.innerHTML = COLORS.map(c => `
    <div class="csw${active === c.n ? ' on' : ''}" style="background:${c.h}" data-name="${c.n}" role="radio" aria-checked="${active === c.n}" aria-label="Couleur ${c.n}" tabindex="0"></div>
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
  document.getElementById('lColor').value = COLORS.find(c => c.n === name)?.h || '#3B82F6';
  buildColorGrid('lCGrid', name, onListColorPick);
}

function syncSettingsUI() {
  const soundOn = cfg.sound !== false;
  const darkTog  = document.getElementById('darkTog');
  const soundTog = document.getElementById('soundTog');

  darkTog.classList.toggle('on', !!cfg.dark);
  darkTog.setAttribute('aria-checked', !!cfg.dark);
  soundTog.classList.toggle('on', soundOn);
  soundTog.setAttribute('aria-checked', soundOn);
  document.getElementById('soundSel').value = cfg.soundChoice || 'A';
  
  // Langue
  const langSel = document.getElementById('langSelector');
  if (langSel) {
    langSel.value = cfg.lang || 'fr';
    langSel.addEventListener('change', (e) => {
      loadLanguage(e.target.value);
    });
  }
  
  // Seuils
  const thres = cfg.thresholds || { 50: true, 80: true, 100: true };
  document.getElementById('threshold50').checked = thres[50] || false;
  document.getElementById('threshold80').checked = thres[80] || false;
  document.getElementById('threshold100').checked = thres[100] || false;
}

/* =============================================================
   6. NAVIGATION
============================================================= */
let currentTab = 'home';

function goTo(tab) {
  currentTab = tab;

  document.querySelectorAll('.view').forEach(v => v.classList.remove('on'));
  document.getElementById(`v-${tab}`).classList.add('on');

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('on');
    t.removeAttribute('aria-current');
  });
  if (tab === 'home' || tab === 'lists' || tab === 'settings') {
    const activeTab = document.getElementById(`t-${tab}`);
    activeTab.classList.add('on');
    activeTab.setAttribute('aria-current', 'page');
  }

  const btnBack = document.getElementById('btnBack');
  if (tab === 'home') {
    btnBack.style.display = 'none';
  } else {
    btnBack.style.display = 'flex';
  }

  // Titres traduits
  const titles = {
    home: getActiveName(),
    lists: t('nav.lists'),
    settings: t('nav.settings'),
    help: t('nav.help')
  };
  document.getElementById('htitle').textContent = titles[tab] || t('nav.help');

  const onHome = tab === 'home';
  document.getElementById('fab').style.display    = onHome ? 'flex' : 'none';
  document.getElementById('btnAdd').style.display = onHome ? 'flex' : 'none';

  if (tab === 'lists')    renderLists();
  if (tab === 'home')     renderHome();
  if (tab === 'settings') buildColorGrid('cGrid', cfg.color || 'blue', onMainColorPick);
}

function getActiveName() {
  return lists.find(l => l.id === activeId)?.name || t('app_name');
}

/* =============================================================
   7. RENDU – ACCUEIL
============================================================= */
function renderAll() {
  renderHome();
  renderLists();
}

function renderHome() {
  const list  = lists.find(l => l.id === activeId);
  const items = list?.items || [];

  document.getElementById('htitle').textContent    = list?.name || t('app_name');
  document.getElementById('aListName').textContent = list?.name || t('home.no_list');
  document.getElementById('aListIco').textContent  = list?.emoji || '🛒';

  const mapContainer = document.getElementById('listMapContainer');
  const mapThumb = document.getElementById('mapThumb');
  if (list && list.mapImage) {
    mapContainer.style.display = 'block';
    mapThumb.src = list.mapImage;
    mapThumb.style.display = 'inline';
  } else {
    mapContainer.style.display = 'none';
  }

  const query    = document.getElementById('searchIn').value.toLowerCase().trim();
  const filtered = query ? items.filter(i => i.text.toLowerCase().includes(query)) : items;

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

    const groups = {};
    filtered.forEach(item => {
      const key = item.cat || '';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let html = '';

    Object.entries(groups).forEach(([cat, groupItems]) => {
      if (cat) {
        const color = CAT_COLORS[cat] || '#64748B';
        html += `<div class="chdr" style="background:${color}18; color:${color}"><span>${esc(cat)}</span><span class="chdr-count">${groupItems.length}</span></div>`;
      }
      groupItems.forEach(item => {
        const qtyDisplay = item.unit ? formatQuantity(item.qty, item.unit) : item.qty;
        const priceDisplay = item.price ? item.price.toFixed(2) + '€' : '<span style="color:var(--tx3)">€</span>';
        const pricePerUnitDisplay = item.pricePerUnit ? ` <span class="price-per-unit">(${item.pricePerUnit.toFixed(2)}€/${getUnitSymbol(item.unit)})</span>` : '';

        html += `
          <li class="irow${item.ck ? ' ckd' : ''}" id="ir-${item.id}">
            <button class="icheck${item.ck ? ' on' : ''}" onclick="toggleCheck('${item.id}')" aria-label="${item.ck ? 'Décocher' : 'Cocher'} ${esc(item.text)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
            <div class="ibody" onclick="openEditItem('${item.id}')" role="button" tabindex="0" aria-label="Modifier ${esc(item.text)}">
              <div class="itxt">${esc(item.text)}</div>
              ${item.note ? `<div class="imeta">${esc(item.note)}</div>` : ''}
            </div>
            <div class="iact">
              <button class="qbtn" onclick="adjustQty('${item.id}', -1)" aria-label="Diminuer quantité">−</button>
              <span class="qnum">${qtyDisplay}</span>
              <button class="qbtn" onclick="adjustQty('${item.id}', 1)" aria-label="Augmenter quantité">+</button>
              <div class="iprice" onclick="inlineEditPrice('${item.id}')" role="button" tabindex="0" aria-label="Prix de ${esc(item.text)}">
                <span id="pr-${item.id}">${priceDisplay}${pricePerUnitDisplay}</span>
              </div>
              <button class="idel" onclick="deleteItem('${item.id}')" aria-label="Supprimer ${esc(item.text)}">
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
    listEl.innerHTML = html;
    
    if (window.reinitDragDrop) {
      setTimeout(reinitDragDrop, 0);
    }
  }

  let count = items.length;
  let countText = count + ' ' + (count > 1 ? t('home.article_plural') : t('home.article_singular'));
  document.getElementById('totCount').textContent = countText;
}

/* =============================================================
   8. RENDU – LISTES
============================================================= */
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
    const totalText = total + ' ' + (total > 1 ? t('home.article_plural') : t('home.article_singular'));
    const doneText = done + ' ' + (done > 1 ? t('home.checked_plural') : t('home.checked_singular'));

    return `
      <div class="lcard${isActive ? ' sel' : ''}" onclick="pickList('${list.id}')" role="button" tabindex="0" aria-label="Sélectionner ${esc(list.name)}" aria-pressed="${isActive}">
        <div class="lbanner" style="background:${list.color}22">${list.emoji || '🛒'}</div>
        <div class="linfo">
          <div class="lname" title="${esc(list.name)}">${esc(list.name)}</div>
          <div class="lstats">${totalText} · ${doneText}</div>
          <div class="lprog" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100">
            <div class="lprogf" style="width:${pct}%; background:${list.color}"></div>
          </div>
        </div>
        <div class="lbtns">
          <button class="lbtn map" onclick="event.stopPropagation(); captureMap('${list.id}')" aria-label="Ajouter une photo du magasin">📷</button>
          <button class="lbtn" onclick="event.stopPropagation(); renameList('${list.id}')" aria-label="Renommer ${esc(list.name)}">✏️</button>
          <button class="lbtn danger" onclick="event.stopPropagation(); removeList('${list.id}')" aria-label="Supprimer ${esc(list.name)}">🗑</button>
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
   9. BUDGET
============================================================= */
function onBudgetChange() {
  budget = parseFloat(document.getElementById('budgetIn').value) || 0;
  saveData();
  updateBudget();
}

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
    document.getElementById('balertTxt').textContent = 'Dépassement de ' + Math.abs(rem).toFixed(2) + ' €';
    if (cfg.sound !== false && !alertPlayed) {
      alertPlayed = true;
      playSound();
    }
  } else {
    alertEl.classList.remove('on');
    alertPlayed = false;
  }

  // Changer le libellé "Restant" en "Dépassement" si négatif
  const remLbl = document.getElementById('remLbl');
  if (remLbl) {
    remLbl.textContent = rem < 0 ? t('home.overbudget') : t('home.remaining');
  }

  // Gestion des seuils
  const thresholds = cfg.thresholds || { 50: true, 80: true, 100: true };
  const roundedPct = Math.round(pct);
  for (let [threshold, enabled] of Object.entries(thresholds)) {
    if (enabled && roundedPct >= threshold && !triggeredThresholds[threshold]) {
      triggeredThresholds[threshold] = true;
      if (cfg.sound !== false) playSound();
      showSnack(`⚠️ Seuil de ${threshold}% atteint !`);
    }
  }
  if (pct < 50) triggeredThresholds = {};
}

/* =============================================================
   10. CRUD ARTICLES
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

  showSnack(`"${deleted.text}" supprimé`, 'Annuler', () => {
    list.items.splice(idx, 0, deleted);
    saveData();
    renderHome();
  });
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
   11. BOTTOM SHEET ARTICLE (AJOUT / MODIFICATION)
============================================================= */
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
  
  // Réinitialiser les champs d'unité
  document.getElementById('iUnit').value = 'pce';
  document.getElementById('fldPricePerUnit').style.display = 'none';
  document.getElementById('iPricePerUnit').value = '';

  toggleMultiMode(false);

  // Arrêter le scan si en cours
  stopBarcodeScan();

  openSheet('shItem');
  setTimeout(() => document.getElementById('iName').focus(), 320);
}

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
  
  // Unités
  document.getElementById('iUnit').value = item.unit || 'pce';
  if (item.pricePerUnit) {
    document.getElementById('iPricePerUnit').value = item.pricePerUnit;
    if (item.unit === 'kg' || item.unit === 'l' || item.unit === 'g' || item.unit === 'ml') {
      document.getElementById('fldPricePerUnit').style.display = 'block';
    }
  } else {
    document.getElementById('fldPricePerUnit').style.display = 'none';
  }

  toggleMultiMode(false);

  // Arrêter le scan si en cours
  stopBarcodeScan();

  openSheet('shItem');
}

function adjustSheetQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById('qDisp').textContent = currentQty;
}

function validateItemForm() {
  const raw     = document.getElementById('iName').value;
  const filled  = raw.trim().length > 0;
  const names   = parseNames(raw);
  const isMulti = names.length > 1;

  document.getElementById('iSubmit').disabled = !filled;

  const hint = document.getElementById('iNameHint');
  if (isMulti) {
    hint.textContent = `${names.length} articles seront ajoutés · prix à renseigner individuellement`;
  } else {
    hint.textContent = '';
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
  const raw   = document.getElementById('iName').value.trim();
  if (!raw) return;

  const list  = lists.find(l => l.id === activeId);
  if (!list) return;

  const names   = parseNames(raw);
  const isMulti = names.length > 1 && !editItemId;
  const cat     = document.getElementById('iCat').value;

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
    showSnack(`${names.length} articles ajoutés ✓`);
  } else {
    const unit = document.getElementById('iUnit').value;
    const pricePerUnit = parseFloat(document.getElementById('iPricePerUnit').value) || 0;
    let price = 0;
    if (pricePerUnit > 0 && (unit === 'kg' || unit === 'l' || unit === 'g' || unit === 'ml')) {
      price = pricePerUnit * currentQty;
    } else {
      price = parseFloat(document.getElementById('iPrice').value) || 0;
    }
    const note  = document.getElementById('iNote').value.trim();

    // Détection des doublons en mode simple
    if (!editItemId && !isMulti) {
      const existing = list.items.find(i => i.text.toLowerCase() === names[0].toLowerCase());
      if (existing) {
        if (confirm(`"${names[0]}" est déjà dans la liste. Voulez-vous augmenter la quantité ?`)) {
          existing.qty = (existing.qty || 1) + currentQty;
          saveData();
          closeSheet();
          renderHome();
          showSnack('Quantité augmentée');
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
    showSnack(editItemId ? `${names[0]} modifié ✓` : `${names[0]} ajouté ✓`);
  }
}

function buildQuickChips() {
  const container = document.getElementById('qChips');
  container.innerHTML = QUICK_ITEMS.map(name =>
    `<button class="chip" aria-label="Ajouter ${name} à la saisie">${name}</button>`
  ).join('');

  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const input   = document.getElementById('iName');
      const current = input.value.trim();
      input.value = current ? current + ', ' + chip.textContent : chip.textContent;
      input.dispatchEvent(new Event('input'));
    });
  });
}

/* =============================================================
   12. BOTTOM SHEET CRÉATION DE LISTE
============================================================= */
function openAddList() {
  document.getElementById('lName').value       = '';
  document.getElementById('lEmoji').value      = '🛒';
  document.getElementById('lSubmit').disabled  = true;

  buildColorGrid('lCGrid', null, onListColorPick);
  document.getElementById('lColor').value = '#3B82F6';

  openSheet('shList');
  setTimeout(() => document.getElementById('lName').focus(), 320);
}

function validateListForm() {
  document.getElementById('lSubmit').disabled = !document.getElementById('lName').value.trim().length;
}

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
   13. GESTION DES LISTES + CARTE MAGASIN
============================================================= */
function pickList(listId) {
  activeId = listId;
  saveData();
  goTo('home');
}

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
      // Ouvrir l'éditeur avec l'image chargée
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
  const img = modal.querySelector('img');
  img.src = list.mapImage;
  modal.style.display = 'flex';
}

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
   14. PARTAGE / EXPORT .TXT (partage texte lisible)
============================================================= */
function buildTxtContent(list) {
  const sep  = '─'.repeat(36);
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  let txt = '';
  txt += `${list.emoji || '🛒'}  ${list.name.toUpperCase()}\n`;
  txt += `${sep}\n`;
  txt += `📅 ${date}\n\n`;

  const groups = {};
  list.items.forEach(item => {
    const key = item.cat || 'Divers';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  Object.entries(groups).forEach(([cat, items]) => {
    if (cat !== 'Divers' || Object.keys(groups).length > 1) {
      txt += `\n▸ ${cat}\n`;
    }
    items.forEach(item => {
      const check    = item.ck ? '✓' : '☐';
      const qty      = (item.qty || 1) > 1 ? `  x${item.qty}` : '    ';
      const price    = item.price ? `  —  ${(item.price * (item.qty || 1)).toFixed(2)} €` : '';
      const note     = item.note ? `  (${item.note})` : '';
      const name     = item.text.padEnd(22, ' ');
      txt += `  ${check}  ${name}${qty}${price}${note}\n`;
    });
  });

  const total = list.items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const done  = list.items.filter(i => i.ck).length;

  txt += `\n${sep}\n`;
  txt += `✅ Cochés : ${done} / ${list.items.length} article${list.items.length !== 1 ? 's' : ''}\n`;
  if (total > 0) txt += `💰 Total  : ${total.toFixed(2)} €\n`;
  txt += `\n📱 Courses Malin\n`;
  return txt;
}

function shareList() {
  const list = lists.find(l => l.id === activeId);
  if (!list) { showSnack(t('share.no_list')); return; }
  if (!list.items.length) { showSnack(t('share.empty_list')); return; }

  const content = buildTxtContent(list);
  const blob = new Blob([content], { type: 'text/plain' });
  const file = new File([blob], `${list.name.replace(/[^a-z0-9]/gi, '_')}.txt`, { type: 'text/plain' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({
      title: list.name,
      files: [file]
    }).catch(() => {
      downloadTxt(content, list.name);
    });
  } else {
    downloadTxt(content, list.name);
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
   15. EXPORT CSV (pour le bouton Exporter)
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
   16. SON
============================================================= */
function playSound() {
  stopSound();
  const choice = document.getElementById('soundSel').value;
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
   17. OVERLAY & SHEETS
============================================================= */
function openSheet(sheetId) {
  openSheetId = sheetId;
  document.getElementById('ovl').classList.add('on');
  document.getElementById(sheetId).classList.add('on');
  document.getElementById(sheetId).setAttribute('aria-hidden', 'false');
}

function closeSheet() {
  // Arrêter le scan si en cours
  stopBarcodeScan();
  if (openSheetId) {
    document.getElementById(openSheetId).classList.remove('on');
    document.getElementById(openSheetId).setAttribute('aria-hidden', 'true');
  }
  document.getElementById('ovl').classList.remove('on');
  openSheetId = null;
}

/* =============================================================
   18. SCAN DE CODE-BARRES (avec html5-qrcode + Open Food Facts)
============================================================= */
function startBarcodeScan() {
  if (html5QrCode) return; // déjà en cours

  const container = document.getElementById('scannerContainer');
  container.style.display = 'block';

  html5QrCode = new Html5Qrcode("qr-reader");
  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    if (multiScanMode) {
      fetchProductFromBarcodeMultiple(decodedText);
    } else {
      // Mode simple : on arrête et on remplit le formulaire
      stopBarcodeScan();
      fetchProductFromBarcode(decodedText);
    }
  };
  const config = { fps: 10, qrbox: { width: 250, height: 250 } };

  html5QrCode.start(
    { facingMode: "environment" }, // caméra arrière
    config,
    qrCodeSuccessCallback,
    (errorMessage) => {
      // erreur de scan (ignorée, on continue)
    }
  ).catch(err => {
    showSnack('Erreur accès caméra');
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
  document.getElementById('scannerContainer').style.display = 'none';
  document.getElementById('scanResultPanel').style.display = 'none';
}

function fetchProductFromBarcode(barcode) {
  showSnack(`Recherche du produit ${barcode}...`);
  fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 1) {
        const product = data.product;
        document.getElementById('iName').value = product.product_name || '';

        // Tentative de correspondance avec les catégories prédéfinies
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
        if (matchedCat) document.getElementById('iCat').value = matchedCat;

        if (product.brands) {
          document.getElementById('iNote').value = product.brands;
        }

        // Déclencher validation pour activer le bouton
        document.getElementById('iName').dispatchEvent(new Event('input'));
        showSnack('Produit trouvé !');
      } else {
        showSnack('Produit non trouvé');
      }
    })
    .catch(err => {
      console.error(err);
      showSnack('Erreur API');
    });
}

function fetchProductFromBarcodeMultiple(barcode) {
  showSnack(`Recherche...`, null, null, true);
  fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
    .then(response => response.json())
    .then(data => {
      if (data.status === 1) {
        lastScannedBarcode = barcode;
        lastScannedProductData = data.product;
        showScanResult(data.product);
      } else {
        lastScannedBarcode = barcode;
        lastScannedProductData = { product_name: `Code: ${barcode}`, brands: '' };
        showScanResult({ product_name: `Code: ${barcode}`, brands: '' });
      }
    })
    .catch(err => {
      console.error(err);
      showSnack('Erreur API');
    });
}

function showScanResult(product) {
  const panel = document.getElementById('scanResultPanel');
  document.getElementById('scanProductName').textContent = product.product_name || 'Produit inconnu';
  panel.style.display = 'block';
}

function addProductFromScan(product) {
  const list = lists.find(l => l.id === activeId);
  if (!list) return;

  // Vérifier les doublons (par code-barres ou par nom)
  const existing = list.items.find(item => 
    item.barcode === lastScannedBarcode || 
    (product.product_name && item.text.toLowerCase() === product.product_name.toLowerCase())
  );
  if (existing) {
    if (confirm(`"${existing.text}" est déjà dans la liste. Voulez-vous augmenter la quantité ?`)) {
      existing.qty = (existing.qty || 1) + 1;
      saveData();
      renderHome();
      showSnack('Quantité augmentée');
    }
    return;
  }

  // Déterminer la catégorie
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

  // Ajouter l'article
  list.items.push({
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 5),
    text: product.product_name || 'Produit',
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
  showSnack('Article ajouté');
}

/* =============================================================
   19. ÉDITEUR D'IMAGE (recadrage, rotation)
============================================================= */
function openImageEditor(imageDataUrl, listId) {
  currentListIdForImage = listId;
  const img = document.getElementById('imageToEdit');
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
   20. MODAL LOGO
============================================================= */
function showLogoModal() {
  document.getElementById('logoModal').style.display = 'flex';
}

function closeLogoModal() {
  document.getElementById('logoModal').style.display = 'none';
}

/* =============================================================
   21. SNACKBAR
============================================================= */
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

function triggerSnackAction() {
  if (snkCallback) { snkCallback(); snkCallback = null; }
  document.getElementById('snk').classList.remove('on');
}

/* =============================================================
   22. UTILITAIRES
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
   23. EXPORT / IMPORT CSV (avec sélection)
============================================================= */
function showExportSelector() {
  const container = document.getElementById('exportListCheckboxes');
  if (lists.length === 0) {
    showSnack('Aucune liste à exporter');
    return;
  }

  let html = '';
  lists.forEach(list => {
    html += `
      <div style="margin-bottom: 10px;">
        <label style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" class="export-checkbox" data-list-id="${list.id}" checked>
          <span>${list.emoji} ${esc(list.name)} (${list.items.length} article${list.items.length !== 1 ? 's' : ''})</span>
        </label>
      </div>
    `;
  });
  container.innerHTML = html;

  openSheet('shExport');
}

function confirmExport() {
  const checkboxes = document.querySelectorAll('.export-checkbox');
  const selectedIds = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      selectedIds.push(cb.dataset.listId);
    }
  });

  if (selectedIds.length === 0) {
    showSnack('Aucune liste sélectionnée');
    return;
  }

  const selectedLists = lists.filter(list => selectedIds.includes(list.id));

  // Générer le CSV pour les listes sélectionnées
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

  // Nom de fichier
  let baseName = 'mes_listes';
  if (selectedLists.length === 1) {
    baseName = selectedLists[0].name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }
  const date = new Date().toISOString().slice(0,10);
  const filename = `${baseName}_${date}.csv`;

  downloadCSV(csvContent, filename);
  closeSheet();
}

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
      const lines = csv.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        showSnack('Fichier CSV vide');
        return;
      }

      // Vérification de l'en-tête (première ligne)
      const header = lines[0].split(';').map(s => s.replace(/^"|"$/g, '').trim());
      if (header.length < 7) {
        showSnack('Format CSV invalide (en-tête incorrect)');
        return;
      }

      const newLists = [];
      const listMap = {};

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';').map(s => s.replace(/^"|"$/g, '').trim());
        if (cols.length < 7) continue; // ligne mal formée

        const listName = cols[0];
        if (!listName) continue;

        if (!listMap[listName]) {
          const newList = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            name: listName,
            emoji: '🛒',
            color: '#3B82F6',
            items: [],
            mapImage: null
          };
          listMap[listName] = newList;
          newLists.push(newList);
        }

        const item = {
          id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          text: cols[1],
          qty: parseInt(cols[2]) || 1,
          price: parseFloat(cols[3]) || 0,
          cat: cols[4] || '',
          note: cols[5] || '',
          ck: cols[6] === '1' ? true : false,
          unit: 'pce',
          pricePerUnit: 0
        };
        listMap[listName].items.push(item);
      }

      if (newLists.length === 0) {
        showSnack('Aucune liste trouvée dans le fichier');
        return;
      }

      if (confirm(`Remplacer les ${lists.length} liste(s) existante(s) par ${newLists.length} nouvelle(s) liste(s) ?`)) {
        lists = newLists;
        activeId = lists[0]?.id || null;
        saveData();
        renderAll();
        goTo('home');
        showSnack('Import terminé');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };
  input.click();
}

/* =============================================================
   24. ATTACHEMENT DES ÉCOUTEURS
============================================================= */
function attachListeners() {
  // Header
  document.getElementById('btnBack').addEventListener('click', () => goTo('home'));
  document.getElementById('headerLogo').addEventListener('click', showLogoModal);
  document.getElementById('btnAdd').addEventListener('click', openAddItem);

  // Navigation
  document.getElementById('t-home').addEventListener('click',     () => goTo('home'));
  document.getElementById('t-lists').addEventListener('click',    () => goTo('lists'));
  document.getElementById('t-settings').addEventListener('click', () => goTo('settings'));

  // FAB
  document.getElementById('fab').addEventListener('click', openAddItem);

  // Overlay
  document.getElementById('ovl').addEventListener('click', closeSheet);

  // Accueil
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
  document.getElementById('locateStoreBtn').addEventListener('click', () => {
    if (activeId) locateStore(activeId);
  });

  // État vide
  document.getElementById('emptyState').addEventListener('click', () => {
    if (lists.length === 0) {
      goTo('lists');
    } else {
      openAddItem();
    }
  });

  // Sheet Article
  document.getElementById('iName').addEventListener('input', validateItemForm);
  document.getElementById('qtyMinus').addEventListener('click', () => adjustSheetQty(-1));
  document.getElementById('qtyPlus').addEventListener('click',  () => adjustSheetQty(+1));
  document.getElementById('iSubmit').addEventListener('click', confirmItem);
  document.getElementById('iUnit').addEventListener('change', function() {
    const unit = this.value;
    const pricePerUnitField = document.getElementById('fldPricePerUnit');
    if (unit === 'kg' || unit === 'l' || unit === 'g' || unit === 'ml') {
      pricePerUnitField.style.display = 'block';
    } else {
      pricePerUnitField.style.display = 'none';
    }
  });

  // Toggle scan multiple
  document.getElementById('multiScanToggle').addEventListener('click', () => {
    multiScanMode = !multiScanMode;
    const tog = document.getElementById('multiScanToggle');
    tog.classList.toggle('on', multiScanMode);
    tog.setAttribute('aria-checked', multiScanMode);
  });

  // Scan
  document.getElementById('btnScanBarcode').addEventListener('click', startBarcodeScan);
  document.getElementById('btnStopScan').addEventListener('click', stopBarcodeScan);

  // Boutons du panneau de résultat de scan
  document.getElementById('scanAddBtn').addEventListener('click', () => {
    if (lastScannedProductData) {
      addProductFromScan(lastScannedProductData);
    }
    document.getElementById('scanResultPanel').style.display = 'none';
  });
  document.getElementById('scanIgnoreBtn').addEventListener('click', () => {
    document.getElementById('scanResultPanel').style.display = 'none';
  });
  document.getElementById('scanStopBtn').addEventListener('click', () => {
    stopBarcodeScan();
    document.getElementById('scanResultPanel').style.display = 'none';
  });

  // Speech
  document.getElementById('btnSpeech').addEventListener('click', startListening);

  // Sheet Liste
  document.getElementById('lName').addEventListener('input', validateListForm);
  document.getElementById('lSubmit').addEventListener('click', confirmList);

  // Mes Listes
  document.getElementById('btnNewList').addEventListener('click', openAddList);

  // Export/Import (avec sélection)
  document.getElementById('btnExportLists').addEventListener('click', showExportSelector);
  document.getElementById('btnImportLists').addEventListener('click', importListsFromCSV);

  // Boutons du sheet d'export
  document.getElementById('btnCancelExport').addEventListener('click', closeSheet);
  document.getElementById('btnConfirmExport').addEventListener('click', confirmExport);

  // Réglages
  document.getElementById('darkTog').addEventListener('click',    toggleDark);
  document.getElementById('soundTog').addEventListener('click',   toggleSound);
  document.getElementById('soundSel').addEventListener('change',  saveConfig);
  document.getElementById('btnPlaySound').addEventListener('click', playSound);
  document.getElementById('btnStopSound').addEventListener('click', stopSound);
  document.getElementById('btnReset').addEventListener('click',   resetAll);
  document.getElementById('btnHelp').addEventListener('click', () => goTo('help'));

  // Éditeur d'image
  document.getElementById('btnRotateLeft').addEventListener('click', () => {
    if (cropper) cropper.rotate(-90);
  });
  document.getElementById('btnRotateRight').addEventListener('click', () => {
    if (cropper) cropper.rotate(90);
  });
  document.getElementById('btnFlipHorizontal').addEventListener('click', () => {
    if (cropper) {
      const scaleX = cropper.getData().scaleX || 1;
      cropper.scaleX(-scaleX);
    }
  });
  document.getElementById('btnFlipVertical').addEventListener('click', () => {
    if (cropper) {
      const scaleY = cropper.getData().scaleY || 1;
      cropper.scaleY(-scaleY);
    }
  });
  document.getElementById('btnCancelImageEdit').addEventListener('click', () => {
    closeSheet();
    if (cropper) cropper.destroy();
    cropper = null;
  });
  document.getElementById('btnSaveImageEdit').addEventListener('click', () => {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas();
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const list = lists.find(l => l.id === currentListIdForImage);
    if (list) {
      list.mapImage = croppedDataUrl;
      saveData();
      if (currentListIdForImage === activeId) renderHome();
      renderLists();
      showSnack('Carte du magasin enregistrée');
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
  document.getElementById('logoModal').addEventListener('click', closeLogoModal);
}

/* =============================================================
   DÉMARRAGE
============================================================= */
document.addEventListener('DOMContentLoaded', init);