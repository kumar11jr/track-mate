import { useEffect, useState } from "react";
import { Loader2, Navigation, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

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
    if (!userLocation || !destination) return;

    const initMap = async () => {
      try {
        // Check if Google Maps is loaded
        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps not loaded");
        }

        // Create map centered between user location and destination
        const centerLat = (userLocation.lat + (destination.lat || 0)) / 2;
        const centerLng = (userLocation.lng + (destination.lng || 0)) / 2;

        const mapElement = document.getElementById("map");
        if (!mapElement) return;

        const mapInstance = new google.maps.Map(mapElement, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
        });

        // Create markers for user location and destination
        // User location marker (blue)
        new google.maps.Marker({
          position: userLocation,
          map: mapInstance,
          title: "Your Location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 8,
          },
        });

        // Add a pulsing circle around user location
        new google.maps.Circle({
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
        new google.maps.Marker({
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

        // Initialize directions service and renderer
        const service = new google.maps.DirectionsService();
        const renderer = new google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: true, // We're using custom markers
          polylineOptions: {
            strokeColor: "#4285F4",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        setMap(mapInstance);
        setDirectionsService(service);
        setDirectionsRenderer(renderer);

        // Calculate and display route
        if (destination.lat && destination.lng) {
          const request: google.maps.DirectionsRequest = {
            origin: userLocation,
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
          };

          service.route(request, (result, status) => {
            if (status === "OK" && result) {
              renderer.setDirections(result);
              
              // Extract distance and duration
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

    // Load map after a short delay to ensure container is rendered
    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, [userLocation, destination]);

  // Handle travel mode change
  const changeTravelMode = (mode: google.maps.TravelMode) => {
    if (!directionsService || !userLocation || !destination.lat || !destination.lng) return;

    setIsLoading(true);
    const request: google.maps.DirectionsRequest = {
      origin: userLocation,
      destination: { lat: destination.lat, lng: destination.lng },
      travelMode: mode,
      unitSystem: google.maps.UnitSystem.METRIC,
    };

    directionsService.route(request, (result, status) => {
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

      {/* Map Container */}
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

        {/* Close button */}
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

      {/* Route Information */}
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

      {/* Travel Mode Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(google.maps.TravelMode.DRIVING)}
          disabled={isLoading}
        >
          🚗 Driving
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(google.maps.TravelMode.WALKING)}
          disabled={isLoading}
        >
          🚶 Walking
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(google.maps.TravelMode.BICYCLING)}
          disabled={isLoading}
        >
          🚴 Cycling
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => changeTravelMode(google.maps.TravelMode.TRANSIT)}
          disabled={isLoading}
        >
          🚌 Transit
        </Button>
      </div>

      {/* Legend */}
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