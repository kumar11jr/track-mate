let googleMapsPromise: Promise<void> | null = null;

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    try {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;

      script.addEventListener('load', () => {
        resolve();
      });

      script.addEventListener('error', (error) => {
        reject(new Error('Failed to load Google Maps script'));
      });

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return googleMapsPromise;
}