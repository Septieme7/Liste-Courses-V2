/* =============================================================
   geolocation.js - Localisation du magasin via OpenStreetMap
============================================================= */

async function locateStore(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  if (!navigator.geolocation) {
    showSnack(t('home.geolocation_unsupported'));
    return;
  }

  showSnack(t('home.locating'));

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      const data = await response.json();

      let locationName = data.display_name || t('home.unknown_location');
      if (confirm(t('home.location_confirm', { name: list.name }))) {
        list.location = {
          name: locationName,
          lat: latitude,
          lon: longitude
        };
        saveData();
        showSnack(t('home.location_saved'));
        renderHome(); // pour afficher le nouveau bouton itinéraire
      }
    } catch (error) {
      console.error('Erreur géocodage:', error);
      showSnack(t('home.geocoding_error'));
    }
  }, (error) => {
    console.error('Erreur géolocalisation:', error);
    showSnack(t('home.location_error'));
  });
}

// Exposer la fonction
window.locateStore = locateStore;