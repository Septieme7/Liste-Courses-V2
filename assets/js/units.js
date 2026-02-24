/* =============================================================
   units.js - Gestion des unités de mesure
============================================================= */

const UNITS = [
  { value: 'pce', labelKey: 'units.piece', symbol: '' },
  { value: 'kg', labelKey: 'units.kg', symbol: 'kg' },
  { value: 'g', labelKey: 'units.g', symbol: 'g' },
  { value: 'l', labelKey: 'units.l', symbol: 'L' },
  { value: 'ml', labelKey: 'units.ml', symbol: 'mL' },
  { value: 'pack', labelKey: 'units.pack', symbol: 'pqt' }
];

function getUnitLabel(unitValue) {
  const unit = UNITS.find(u => u.value === unitValue);
  return unit ? t(unit.labelKey) : unitValue;
}

function getUnitSymbol(unitValue) {
  const unit = UNITS.find(u => u.value === unitValue);
  return unit ? unit.symbol : '';
}

function formatQuantity(qty, unit) {
  if (!unit || unit === 'pce') return qty;
  return `${qty} ${getUnitSymbol(unit)}`;
}

// Expose globally
window.UNITS = UNITS;
window.getUnitLabel = getUnitLabel;
window.getUnitSymbol = getUnitSymbol;
window.formatQuantity = formatQuantity;