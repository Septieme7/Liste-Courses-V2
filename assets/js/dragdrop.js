/* =============================================================
   dragdrop.js - Réorganisation des articles par glisser-déposer
============================================================= */

let sortableInstance = null;

function initDragDrop() {
  const listContainer = document.getElementById('itemsList');
  if (!listContainer) return;

  if (sortableInstance) {
    sortableInstance.destroy();
  }

  sortableInstance = new Sortable(listContainer, {
    animation: 150,
    handle: '.irow',
    draggable: '.irow',
    onEnd: function(evt) {
      const list = lists.find(l => l.id === activeId);
      if (!list) return;

      // Get new order from DOM
      const newOrder = [];
      document.querySelectorAll('#itemsList .irow').forEach(row => {
        const id = row.id.replace('ir-', '');
        if (id) newOrder.push(id);
      });

      // Reorder items array
      const itemsMap = new Map(list.items.map(item => [item.id, item]));
      list.items = newOrder.map(id => itemsMap.get(id)).filter(item => item);

      saveData();
    }
  });
}

function reinitDragDrop() {
  if (typeof Sortable !== 'undefined') {
    initDragDrop();
  }
}

window.reinitDragDrop = reinitDragDrop;