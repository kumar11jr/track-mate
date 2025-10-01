"use client";

import { useEffect, useState } from "react";
import { Loader2, Navigation, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadGoogleMapsScript } from "@/lib/loadGoogleMapsScript";

declare global {
  interface Window {
    google: any;
  }
}

const TravelMode = {
  DRIVING: 'DRIVING',
  WALKING: 'WALKING',
  BICYCLING: 'BICYCLING',
  TRANSIT: 'TRANSIT'
} as const;

const UnitSystem = {
  METRIC: 0,
  IMPERIAL: 1
} as const;

interface SelectedPlace {
  place_id: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface GoogleMapsDirectionsProps {
  destination: SelectedPlace;
  onClose?: () => void;
}

interface UserLocation {
  lat: number;
  lng: number;
}

export default function GoogleMapsDirections({ 
  destination, 
  onClose 
}: GoogleMapsDirectionsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [mapsApiKey, setMapsApiKey] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const initializeGoogleMaps = async () => {
      try {
        const response = await fetch('/api/maps-key');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        if (isMounted) {
          setMapsApiKey(data.apiKey);
          await loadGoogleMapsScript(data.apiKey);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to initialize Google Maps");
          setIsLoading(false);
        }
      }
    };

    initializeGoogleMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Unable to get your current location. Please enable location services.");
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setIsLoading(false);
    }
  }, []);

  // Initialize map and directions
  useEffect(() => {
    if (!userLocation || !destination || !window.google || !window.google.maps) return;

    const initMap = async () => {
      try {
        const centerLat = (userLocation.lat + (destination.lat || 0)) / 2;
        const centerLng = (userLocation.lng + (destination.lng || 0)) / 2;

        const mapElement = document.getElementById("map");
        if (!mapElement) return;

        const mapInstance = new window.google.maps.Map(mapElement, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
        });

        // User location marker (blue)
        new window.google.maps.Marker({
          position: userLocation,
          map: mapInstance,
          title: "Your Location",
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 8,
          },
        });

        // Add a pulsing circle around user location
        new window.google.maps.Circle({
          map: mapInstance,
          center: userLocation,
          radius: 50,
          fillColor: "#4285F4",
          fillOpacity: 0.2,
          strokeColor: "#4285F4",
          strokeOpacity: 0.4,
          strokeWeight: 1,
        });

        // Destination marker (red)
        new window.google.maps.Marker({
          position: { 
            lat: destination.lat || 0, 
            lng: destination.lng || 0 
          },
          map: mapInstance,
          title: destination.address,
          icon: {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
          },
        });

        const service = new window.google.maps.DirectionsService();
        const renderer = new window.google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: true, 
          polylineOptions: {
            strokeColor: "#4285F4",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        setMap(mapInstance);
        setDirectionsService(service);
        setDirectionsRenderer(renderer);

        if (destination.lat && destination.lng) {
          const request = {
            origin: userLocation,
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: TravelMode.DRIVING,
            unitSystem: UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
          };

          service.route(request, (result: any, status: string) => {
            if (status === "OK" && result) {
              renderer.setDirections(result);
              
              const route = result.routes[0];
              if (route && route.legs && route.legs[0]) {
                setDistance(route.legs[0].distance?.text || "");
                setDuration(route.legs[0].duration?.text || "");
              }
            } else {
              console.error("Directions request failed:", status);
              setError("Could not calculate directions to this location");
            }
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("Failed to initialize map. Please check your internet connection.");
        setIsLoading(false);
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, [userLocation, destination]);

  const changeTravelMode = (mode: string) => {
    if (!directionsService || !userLocation || !destination.lat || !destination.lng) return;

    setIsLoading(true);
    const request: any = {
      origin: userLocation,
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: mode,
      unitSystem: UnitSystem.METRIC,
    };

    directionsService.route(request, (result: any, status: string) => {
      if (status === "OK" && result && directionsRenderer) {
        directionsRenderer.setDirections(result);
        const route = result.routes[0];
        if (route && route.legs && route.legs[0]) {
          setDistance(route.legs[0].distance?.text || "");
          setDuration(route.legs[0].duration?.text || "");
        }
      }
      setIsLoading(false);
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="relative">
        <div 
          id="map" 
          className="w-full h-[400px] rounded-lg border shadow-sm"
        />
        
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Loading directions...</span>
            </div>
          </div>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white shadow-md hover:bg-gray-100"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {(distance || duration) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Navigation className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Route Information
              </p>
              <div className="flex gap-4 text-sm text-gray-600">
                {distance && <span>Distance: <strong>{distance}</strong></span>}
                {duration && <span>Duration: <strong>{duration}</strong></span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(TravelMode.DRIVING)}
          disabled={isLoading}
        >
          🚗 Driving
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(TravelMode.WALKING)}
          disabled={isLoading}
        >
          🚶 Walking
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(TravelMode.BICYCLING)}
          disabled={isLoading}
        >
          🚴 Cycling
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(TravelMode.TRANSIT)}
          disabled={isLoading}
        >
          🚌 Transit
        </Button>
      </div>

      <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Your current location</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-red-500" />
          <span>Destination: {destination.address.split(',')[0]}</span>
        </div>
      </div>
    </div>
  );
}