/**
 * Geocode an address to get latitude and longitude coordinates
 * Uses our API endpoint which calls Google Maps Geocoding API
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `/api/geocode?address=${encodeURIComponent(address)}`
    );

    const data = await response.json();

    if (data.success && data.lat && data.lng) {
      return {
        lat: data.lat,
        lng: data.lng,
      };
    }

    console.error('Geocoding failed:', data.error);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get an address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
