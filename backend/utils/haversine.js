
function haversine(coord1, coord2) {
  const R = 6371; 
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const d = 2 * R * Math.asin(Math.sqrt(Math.pow(Math.sin((dLat)/2) , 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow( Math.sin((dLon)/2) , 2)));
  return d * 1000;
}

function toRad(value) {
  return value * Math.PI / 180;
}

module.exports = { haversine };