/* =============================================================
   geolocation.js - Localisation du magasin via OpenStreetMap
============================================================= */

async function locateStore(listId) {
  const list = lists.find(l => l.id === listId);
  if (!list) return;

  if (!navigator.geolocation) {
    showSnack('Geolocation not supported');
    return;
  }

  showSnack('Locating...');

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      const data = await response.json();

      let locationName = data.display_name || 'Unknown location';
      if (confirm(`Associate this location with list "${list.name}"?\n\n${locationName}`)) {
        list.location = {
          name: locationName,
          lat: latitude,
          lon: longitude
        };
        saveData();
        showSnack('Location saved');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      showSnack('Error finding location');
    }
  }, (error) => {
    console.error('Geolocation error:', error);
    showSnack('Could not get your position');
  });
}

window.locateStore = locateStore;