"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

const LocationTester = (): React.JSX.Element => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Fetch Google Maps API key from your server
  const fetchApiKey = async (): Promise<string> => {
    try {
      console.log('Fetching Google Maps API key from server...');
      const response = await fetch('/api/maps-key');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch API key: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('API key fetched successfully');
      return data.apiKey;
    } catch (error) {
      console.error('Error fetching API key:', error);
      throw error;
    }
  };

  // Load Google Maps API dynamically with fetched API key
  const loadGoogleMapsAPI = async (apiKey: string) => {
    return new Promise<void>((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps API already loaded');
        resolve();
        return;
      }

      console.log('Loading Google Maps API...');

      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        console.log('Google Maps API loaded successfully');
        resolve();
      };

      script.onerror = (error) => {
        console.error('Error loading Google Maps API:', error);
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });
  };

  const getLocation = async () => {
    setIsLoading(true);
    setError(null);
    setGoogleMapsError(null);
    setLocation(null);

    try {
      console.log('Starting location and maps loading process...');
      
      // Step 1: Fetch API key from server
      let fetchedApiKey = apiKey;
      if (!fetchedApiKey) {
        fetchedApiKey = await fetchApiKey();
        setApiKey(fetchedApiKey);
      }

      // Step 2: Get user location
      console.log('Checking geolocation support...');
      
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser.');
      }

      console.log('Getting user position...');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Position received:', position);
            resolve(position);
          },
          (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Unknown error occurred.';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied by user.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out.';
                break;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('Your location:', userLocation);
      console.log('Accuracy:', position.coords.accuracy, 'meters');
      
      setLocation(userLocation);

      // Step 3: Load Google Maps API
      console.log('Loading Google Maps API with fetched key...');
      await loadGoogleMapsAPI(fetchedApiKey);
      setIsGoogleMapsLoaded(true);
      console.log('Google Maps API loaded and ready');

    } catch (error) {
      console.error('Error in getLocation process:', error);
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          setGoogleMapsError(error.message);
        } else {
          setError(error.message);
        }
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Location Tester */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Location & Maps Tester</h2>
            </div>

            {/* Status Information */}
            <div className="space-y-2">
              <div className={`p-3 rounded-md ${apiKey ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                <p className={`text-sm ${apiKey ? 'text-green-700' : 'text-gray-700'}`}>
                  Google Maps API Key: {apiKey ? '✅ Fetched from server' : '⏳ Not fetched yet'}
                </p>
              </div>
              
              {location && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    Location: ✅ Obtained ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                  </p>
                </div>
              )}

              {isGoogleMapsLoaded && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    Google Maps: ✅ Loaded and ready
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={getLocation} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {!apiKey ? 'Fetching API Key...' : 
                   !location ? 'Getting Location...' : 
                   'Loading Maps...'}
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Get My Location & Load Maps
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">Location Error: {error}</p>
              </div>
            )}

            {googleMapsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">Maps Error: {googleMapsError}</p>
                <p className="text-xs text-red-600 mt-1">
                  Make sure GOOGLE_MAPS_API_KEY is set in your .env.local file
                </p>
              </div>
            )}

            {location && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                <h3 className="font-semibold text-green-800">Your Location:</h3>
                <div className="text-sm text-green-700">
                  <div><strong>Latitude:</strong> {location.lat}</div>
                  <div><strong>Longitude:</strong> {location.lng}</div>
                  <div className="mt-2">
                    <strong>Google Maps Link:</strong>
                    <br />
                    <a 
                      href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all text-xs"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>• API key is fetched securely from server</p>
              <p>• Your browser will ask for location permission</p>
              <p>• Maps will load after getting your location</p>
              <p>• Check console for detailed logs</p>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Google Maps */}
        {location && isGoogleMapsLoaded && !googleMapsError && (
          <GoogleMapsComponent location={location} />
        )}
      </div>
    </div>
  );
};

// Google Maps Component
const GoogleMapsComponent = ({ location }: { location: { lat: number, lng: number } }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initializeMap = () => {
      if (!window.google || !window.google.maps || !mapRef.current) {
        console.log('Google Maps not ready for initialization');
        return;
      }

      console.log('Initializing map with location:', location);
      
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: location,
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        // Add marker for user location
        const marker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: "Your Current Location",
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          },
        });

        // Add info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: Arial, sans-serif;">
              <h4 style="margin: 0 0 8px 0; color: #1976d2;">Your Location</h4>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Latitude:</strong> ${location.lat.toFixed(6)}</p>
              <p style="margin: 4px 0; font-size: 14px;"><strong>Longitude:</strong> ${location.lng.toFixed(6)}</p>
            </div>
          `,
        });

        // Open info window when marker is clicked
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        // Open info window by default
        infoWindow.open(map, marker);

        setIsLoaded(true);
        console.log('Map initialized successfully with marker and info window!');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Small delay to ensure Google Maps API is fully ready
    setTimeout(initializeMap, 100);
  }, [location]);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Your Location on Map
          </h3>
        </div>
        
        {!isLoaded && (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-gray-600 font-medium">Initializing Map...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef}
          className={`w-full h-96 rounded-lg border-2 border-gray-200 ${!isLoaded ? 'hidden' : 'block'}`}
        />
        
        {isLoaded && (
          <div className="mt-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              ✅ Map loaded with your location marker
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTester;