/* =============================================================
   i18n.js - Gestion des langues
============================================================= */

let currentLang = 'fr';
let translations = {};

async function loadLanguage(lang) {
  try {
    const response = await fetch(`assets/lang/${lang}.json`);
    if (!response.ok) throw new Error('Language file not found');
    translations = await response.json();
    currentLang = lang;
    if (window.cfg) {
      window.cfg.lang = lang;
      if (typeof saveConfig === 'function') saveConfig();
    }
    applyTranslations();
    // Re-render all views
    if (typeof renderHome === 'function') renderHome();
    if (typeof renderLists === 'function') renderLists();
    // Rebuild quick chips for the add form (in case it's open)
    if (typeof buildQuickChips === 'function') buildQuickChips();
    // Rebuild category select
    if (typeof buildCategorySelect === 'function') buildCategorySelect();
    // Update header title if not home
    if (typeof currentTab !== 'undefined' && currentTab !== 'home') {
      document.getElementById('htitle').textContent = t(`nav.${currentTab}`);
    }
  } catch (error) {
    console.error('Error loading language:', error);
    if (lang !== 'fr') loadLanguage('fr');
  }
}

function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations;
  for (let k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Missing translation for ${key}`);
      return key;
    }
  }
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, p) => params[p] || '');
  }
  return value;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else if (el.tagName === 'OPTION') {
      el.textContent = t(key);
    } else {
      el.innerHTML = t(key);
    }
  });

  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });

  document.title = t('app_name');
}

// Expose globally
window.t = t;
window.loadLanguage = loadLanguage;