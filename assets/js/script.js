/* =============================================================
   COURSES MALIN · script.js
   (Version avec scan de code-barres, logo cliquable, bouton retour, carte magasin)
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

const EMOJIS = ['🛒', '🏪', '🍎', '🥗', '🏠', '🎉', '💊', '🐾', '🌿', '🍕', '🛍️', '📦'];

const QUICK_ITEMS = [
  'Pain', 'Lait', 'Œufs', 'Beurre', 'Fromage', 'Yaourt',
  'Eau', 'Pommes', 'Bananes', 'Poulet', 'Pâtes', 'Riz',
  'Café', 'Jus', 'Farine', 'Sucre', 'Sel', 'Huile',
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

// Pour le scan de code-barres
let html5QrCode = null;

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
  renderAll();
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
}

function saveData() {
  localStorage.setItem(LS_LISTS,  JSON.stringify(lists));
  localStorage.setItem(LS_BUDGET, budget);
  localStorage.setItem(LS_ACTIVE, activeId ?? '');
}

function saveConfig() {
  cfg.soundChoice = document.getElementById('soundSel').value;
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
  const activeTab = document.getElementById(`t-${tab}`);
  activeTab.classList.add('on');
  activeTab.setAttribute('aria-current', 'page');

  const btnBack = document.getElementById('btnBack');
  if (tab === 'home') {
    btnBack.style.display = 'none';
  } else {
    btnBack.style.display = 'flex';
  }

  const titles = { home: getActiveName(), lists: 'Mes Listes', settings: 'Réglages' };
  document.getElementById('htitle').textContent = titles[tab];

  const onHome = tab === 'home';
  document.getElementById('fab').style.display    = onHome ? 'flex' : 'none';
  document.getElementById('btnAdd').style.display = onHome ? 'flex' : 'none';

  if (tab === 'lists')    renderLists();
  if (tab === 'home')     renderHome();
  if (tab === 'settings') buildColorGrid('cGrid', cfg.color || 'blue', onMainColorPick);
}

function getActiveName() {
  return lists.find(l => l.id === activeId)?.name || 'Mes Courses';
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

  document.getElementById('htitle').textContent    = list?.name || 'Mes Courses';
  document.getElementById('aListName').textContent = list?.name || 'Aucune liste';
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
              <span class="qnum">${item.qty || 1}</span>
              <button class="qbtn" onclick="adjustQty('${item.id}', 1)" aria-label="Augmenter quantité">+</button>
              <div class="iprice" onclick="inlineEditPrice('${item.id}')" role="button" tabindex="0" aria-label="Prix de ${esc(item.text)}">
                <span id="pr-${item.id}">${item.price ? item.price.toFixed(2) + '€' : '<span style="color:var(--tx3)">€</span>'}</span>
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
  }

  document.getElementById('totCount').textContent = `${items.length} article${items.length !== 1 ? 's' : ''}`;
  updateBudget();
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

    return `
      <div class="lcard${isActive ? ' sel' : ''}" onclick="pickList('${list.id}')" role="button" tabindex="0" aria-label="Sélectionner ${esc(list.name)}" aria-pressed="${isActive}">
        <div class="lbanner" style="background:${list.color}22">${list.emoji || '🛒'}</div>
        <div class="linfo">
          <div class="lname" title="${esc(list.name)}">${esc(list.name)}</div>
          <div class="lstats">${total} article${total !== 1 ? 's' : ''} · ${done} coché${done !== 1 ? 's' : ''}</div>
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
  ['fldQty', 'fldPrice', 'fldNote'].forEach(id => {
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
      });
    });
    saveData();
    closeSheet();
    renderHome();
    showSnack(`${names.length} articles ajoutés ✓`);
  } else {
    const price = parseFloat(document.getElementById('iPrice').value) || 0;
    const note  = document.getElementById('iNote').value.trim();

    if (editItemId) {
      const item = list.items.find(i => i.id === editItemId);
      if (item) {
        item.text  = names[0];
        item.qty   = currentQty;
        item.price = price;
        item.note  = note;
        item.cat   = cat;
      }
    } else {
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
      list.mapImage = readerEvent.target.result;
      saveData();
      if (listId === activeId) renderHome();
      renderLists();
      showSnack('Carte du magasin enregistrée');
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
   14. PARTAGE / EXPORT .TXT
============================================================= */
function shareList() {
  const list = lists.find(l => l.id === activeId);
  if (!list) { showSnack('Aucune liste sélectionnée'); return; }
  if (!list.items.length) { showSnack('La liste est vide, rien à partager'); return; }

  const text = buildTxtContent(list);

  if (navigator.share) {
    navigator.share({ title: list.name, text }).catch(() => downloadTxt(text, list.name));
  } else {
    downloadTxt(text, list.name);
  }
}

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

function downloadTxt(content, listName) {
  const blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const anchor   = document.createElement('a');
  const filename = listName.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();

  anchor.href     = url;
  anchor.download = `${filename}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/* =============================================================
   15. SON
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
   16. OVERLAY & SHEETS
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
   17. SCAN DE CODE-BARRES (avec html5-qrcode + Open Food Facts)
============================================================= */

function startBarcodeScan() {
  if (html5QrCode) return; // déjà en cours

  const container = document.getElementById('scannerContainer');
  container.style.display = 'block';

  html5QrCode = new Html5Qrcode("qr-reader");
  const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    // Arrêter le scan dès qu'un code est trouvé
    stopBarcodeScan();
    fetchProductFromBarcode(decodedText);
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

/* =============================================================
   18. MODAL LOGO
============================================================= */
function showLogoModal() {
  document.getElementById('logoModal').style.display = 'flex';
}

function closeLogoModal() {
  document.getElementById('logoModal').style.display = 'none';
}

/* =============================================================
   19. SNACKBAR
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
   20. UTILITAIRES
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
   21. ATTACHEMENT DES ÉCOUTEURS
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

  // Scan
  document.getElementById('btnScanBarcode').addEventListener('click', startBarcodeScan);
  document.getElementById('btnStopScan').addEventListener('click', stopBarcodeScan);

  // Sheet Liste
  document.getElementById('lName').addEventListener('input', validateListForm);
  document.getElementById('lSubmit').addEventListener('click', confirmList);

  // Mes Listes
  document.getElementById('btnNewList').addEventListener('click', openAddList);

  // Réglages
  document.getElementById('darkTog').addEventListener('click',    toggleDark);
  document.getElementById('soundTog').addEventListener('click',   toggleSound);
  document.getElementById('soundSel').addEventListener('change',  saveConfig);
  document.getElementById('btnPlaySound').addEventListener('click', playSound);
  document.getElementById('btnStopSound').addEventListener('click', stopSound);
  document.getElementById('btnReset').addEventListener('click',   resetAll);

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