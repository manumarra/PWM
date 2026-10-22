export async function getCoordinatesFromAddress(address, city) {
  const query = encodeURIComponent(`${address}, ${city}, Italy`);
  // API pubblica Nominatim di OpenStreetMap
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
  
  const data = await response.json().catch(() => null);

  if (!response.ok || !data || data.length === 0) {
    throw new Error("Indirizzo non trovato sulla mappa");
  }

  return { 
    lat: parseFloat(data[0].lat), 
    lon: parseFloat(data[0].lon) 
  };
}