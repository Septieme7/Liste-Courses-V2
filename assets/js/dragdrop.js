/* =============================================================
   dragdrop.js - Réorganisation des articles par glisser-déposer
   avec gestion du changement de catégorie
============================================================= */

let sortableInstance = null;

/**
 * Initialise le glisser-déposer sur la liste d'articles
 */
function initDragDrop() {
  const listContainer = document.getElementById('itemsList');
  if (!listContainer) return;

  // Détruire l'ancienne instance si elle existe
  if (sortableInstance) {
    sortableInstance.destroy();
  }

  sortableInstance = new Sortable(listContainer, {
    animation: 150,
    handle: '.ibody', // Permet de déplacer uniquement en cliquant sur le nom
    draggable: '.irow',
    onEnd: function(evt) {
      const list = lists.find(l => l.id === activeId);
      if (!list) return;

      // Récupérer tous les articles dans l'ordre du DOM après le déplacement
      const rows = document.querySelectorAll('#itemsList .irow');
      const newOrder = [];
      rows.forEach(row => {
        const id = row.id.replace('ir-', '');
        if (id) newOrder.push(id);
      });

      // Mettre à jour la catégorie de chaque article en fonction de sa position
      const itemsMap = new Map(list.items.map(i => [i.id, i]));

      rows.forEach((row) => {
        const id = row.id.replace('ir-', '');
        const item = itemsMap.get(id);
        if (!item) return;

        // Trouver la catégorie de l'en-tête précédent (via data-cat)
        const prevCat = findPreviousCategory(row);
        if (prevCat !== null && item.cat !== prevCat) {
          item.cat = prevCat; // Mettre à jour la catégorie
        }
      });

      // Réorganiser le tableau items selon le nouvel ordre
      list.items = newOrder.map(id => itemsMap.get(id)).filter(item => item);

      // Sauvegarder et re-rendre (pour que les catégories vides disparaissent)
      saveData();
      renderHome();
    }
  });
}

/**
 * Recherche la catégorie (attribut data-cat) de l'en-tête précédent un élément
 * @param {HTMLElement} el - L'élément article (.irow)
 * @returns {string|null} La valeur de la catégorie ou null si aucun en-tête trouvé
 */
function findPreviousCategory(el) {
  let prev = el.previousElementSibling;
  while (prev) {
    if (prev.classList.contains('chdr')) {
      return prev.dataset.cat; // La valeur originale stockée dans data-cat
    }
    prev = prev.previousElementSibling;
  }
  return null; // Début de liste, pas de catégorie
}

/**
 * Réinitialise le glisser-déposer (appelé après chaque rendu)
 */
function reinitDragDrop() {
  if (typeof Sortable !== 'undefined') {
    initDragDrop();
  }
}

// Exposer la fonction globalement
window.reinitDragDrop = reinitDragDrop;