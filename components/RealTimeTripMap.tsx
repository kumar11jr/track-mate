"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Navigation, MapPin, Users, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loadGoogleMapsScript } from "@/lib/loadGoogleMapsScript";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    google: any;
  }
}

interface Location {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface ParticipantLocation {
  participantId: string;
  userId: string;
  userName: string;
  userEmail: string;
  latestLocation: Location | null;
}

interface RealTimeTripMapProps {
  tripId: string;
  destination: string;
  destinationLat?: number;
  destinationLng?: number;
  currentUserId: string;
  currentParticipantId: string;
}

const colors = [
  "#4285F4", // Blue
  "#34A853", // Green
  "#FBBC04", // Yellow
  "#EA4335", // Red
  "#9334E6", // Purple
  "#FF6D00", // Orange
  "#00ACC1", // Cyan
  "#E91E63", // Pink
];

export default function RealTimeTripMap({
  tripId,
  destination,
  destinationLat,
  destinationLng,
  currentUserId,
  currentParticipantId,
}: RealTimeTripMapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantLocations, setParticipantLocations] = useState<ParticipantLocation[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState<string>("");
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");

  // Log when coordinates change
  useEffect(() => {
    console.log('RealTimeTripMap received destination coordinates:', { destinationLat, destinationLng, destination });
  }, [destinationLat, destinationLng, destination]);
  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const directionsRenderersRef = useRef<Map<string, any>>(new Map());
  const directionsServiceRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasInitializedBounds = useRef(false);

  // Initialize Google Maps
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        const response = await fetch('/api/maps-key');
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setMapsApiKey(data.apiKey);
        await loadGoogleMapsScript(data.apiKey);
      } catch (err) {
        setError("Failed to initialize Google Maps");
        setIsLoading(false);
      }
    };

    initializeGoogleMaps();
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
          setIsLoading(false);
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

  // Initialize map
  useEffect(() => {
    if (!window.google || !window.google.maps || !userLocation) return;

    const mapElement = document.getElementById("real-time-map");
    if (!mapElement) return;

    const mapInstance = new window.google.maps.Map(mapElement, {
      center: userLocation,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
    });

    mapRef.current = mapInstance;

    // Restore persisted view (center/zoom) if available
    try {
      const storageKey = `tripMapView:${tripId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          mapInstance.setCenter({ lat: parsed.lat, lng: parsed.lng });
        }
        if (parsed && typeof parsed.zoom === 'number') {
          mapInstance.setZoom(parsed.zoom);
        }
        // Prevent auto-fit when we already restored a view
        hasInitializedBounds.current = true;
      }
      // Persist view on interactions
      const persistView = () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        if (center && typeof zoom === 'number') {
          localStorage.setItem(storageKey, JSON.stringify({ lat: center.lat(), lng: center.lng(), zoom }));
        }
      };
      // Save after user finishes moving/zooming
      mapInstance.addListener('idle', persistView);
    } catch (e) {
      // ignore storage errors
    }

    const directionsService = new window.google.maps.DirectionsService();
    directionsServiceRef.current = directionsService;
  }, [userLocation, destinationLat, destinationLng]);

  // Fetch and update participant locations
  const fetchParticipantLocations = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/locations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch locations');
      }

      setParticipantLocations(data.participantLocations || []);
    } catch (err) {
      console.error("Error fetching participant locations:", err);
    }
  };

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current || !window.google || !directionsServiceRef.current) return;

    console.log('Drawing markers and routes. Destination coords:', { destinationLat, destinationLng });

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();
    
    directionsRenderersRef.current.forEach((renderer) => renderer.setMap(null));
    directionsRenderersRef.current.clear();

    // Add markers and routes for each participant
    participantLocations.forEach((participant, index) => {
      if (!participant.latestLocation) return;

      const color = colors[index % colors.length];
      const isCurrentUser = participant.userId === currentUserId;

      // Create custom marker icon
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
        scale: isCurrentUser ? 10 : 8,
      };

      const marker = new window.google.maps.Marker({
        position: {
          lat: participant.latestLocation.latitude,
          lng: participant.latestLocation.longitude,
        },
        map: mapRef.current,
        title: `${participant.userName}${isCurrentUser ? ' (You)' : ''}`,
        icon: markerIcon,
        label: {
          text: isCurrentUser ? 'YOU' : participant.userName.charAt(0).toUpperCase(),
          color: 'white',
          fontSize: '10px',
          fontWeight: 'bold',
        },
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${participant.userName}${isCurrentUser ? ' (You)' : ''}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${participant.userEmail}</p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">
              ${new Date(participant.latestLocation.timestamp).toLocaleTimeString()}
            </p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(mapRef.current, marker);
      });

      // Add pulsing circle for current user
      if (isCurrentUser) {
        new window.google.maps.Circle({
          map: mapRef.current,
          center: {
            lat: participant.latestLocation.latitude,
            lng: participant.latestLocation.longitude,
          },
          radius: 50,
          fillColor: color,
          fillOpacity: 0.2,
          strokeColor: color,
          strokeOpacity: 0.4,
          strokeWeight: 1,
        });
      }

      markersRef.current.set(participant.participantId, marker);

      // Draw route from this participant to destination
      if (destinationLat && destinationLng) {
        console.log(`Drawing route for ${participant.userName} from (${participant.latestLocation.latitude}, ${participant.latestLocation.longitude}) to (${destinationLat}, ${destinationLng})`);
        
        const directionsRenderer = new window.google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true,
          preserveViewport: true, // keep user's zoom/center unchanged
          polylineOptions: {
            strokeColor: color,
            strokeWeight: 3,
            strokeOpacity: 0.6,
          },
        });

        directionsRenderersRef.current.set(participant.participantId, directionsRenderer);

        directionsServiceRef.current.route(
          {
            origin: {
              lat: participant.latestLocation.latitude,
              lng: participant.latestLocation.longitude,
            },
            destination: { lat: destinationLat, lng: destinationLng },
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result: any, status: string) => {
            if (status === "OK" && result && directionsRenderer) {
              directionsRenderer.setDirections(result);
              console.log(`Route drawn successfully for ${participant.userName}`);
              
              // Update distance/duration for current user
              if (isCurrentUser) {
                const route = result.routes[0];
                if (route && route.legs && route.legs[0]) {
                  setDistance(route.legs[0].distance?.text || "");
                  setDuration(route.legs[0].duration?.text || "");
                }
              }
            } else {
              console.error(`Failed to draw route for ${participant.userName}:`, status);
            }
          }
        );
      } else {
        console.log(`No destination coordinates available yet for ${participant.userName}`);
      }
    });

    // Adjust map bounds to show all markers ONLY on initial load
    if (participantLocations.length > 0 && !hasInitializedBounds.current) {
      const bounds = new window.google.maps.LatLngBounds();
      participantLocations.forEach((participant) => {
        if (participant.latestLocation) {
          bounds.extend({
            lat: participant.latestLocation.latitude,
            lng: participant.latestLocation.longitude,
          });
        }
      });
      
      if (destinationLat && destinationLng) {
        bounds.extend({ lat: destinationLat, lng: destinationLng });
      }

      // Add padding and set max zoom to prevent over-zooming
      mapRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });

      // Set a maximum zoom level to prevent zooming in too much
      const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
        if (mapRef.current.getZoom() > 15) {
          mapRef.current.setZoom(15);
        }
        hasInitializedBounds.current = true;
      });
    }
  }, [participantLocations, currentUserId, destinationLat, destinationLng]);

  // Initial fetch
  useEffect(() => {
    fetchParticipantLocations();
  }, [tripId]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(fetchParticipantLocations, 5000);
    return () => clearInterval(interval);
  }, [tripId]);

  // Send location updates
  const sendLocationUpdate = async (position: GeolocationPosition) => {
    try {
      await fetch(`/api/locations/${currentParticipantId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading || null,
          speed: position.coords.speed || null,
        }),
      });
    } catch (error) {
      console.error("Error sending location update:", error);
    }
  };

  // Start/stop location tracking
  const toggleTracking = () => {
    if (isTracking) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
    } else {
      // Start tracking
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            sendLocationUpdate(position);
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error("Error tracking location:", error);
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
          }
        );
        setIsTracking(true);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[600px] rounded-lg border shadow-sm flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Real-Time Trip Map</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isTracking ? "default" : "outline"} className="flex items-center gap-1">
            <Radio className={`h-3 w-3 ${isTracking ? 'animate-pulse' : ''}`} />
            {isTracking ? 'Tracking' : 'Not Tracking'}
          </Badge>
          <Button
            onClick={toggleTracking}
            variant={isTracking ? "destructive" : "default"}
            size="sm"
          >
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <div 
          id="real-time-map" 
          className="w-full h-[600px] rounded-lg border shadow-sm"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-semibold text-sm mb-2">Participants & Routes</h4>
          <div className="space-y-1">
            {participantLocations.map((participant, index) => {
              const color = colors[index % colors.length];
              const isCurrentUser = participant.userId === currentUserId;
              return (
                <div key={participant.participantId} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium">
                    {participant.userName}{isCurrentUser ? ' (You)' : ''}
                  </span>
                  {participant.latestLocation && (
                    <span className="text-gray-500">
                      • {new Date(participant.latestLocation.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Each color shows the participant's location and route to destination
          </p>
        </div>

        {/* Destination marker info */}
        {destinationLat && destinationLng && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3">
            <h4 className="font-semibold text-sm mb-1">Destination</h4>
            <p className="text-xs text-gray-600 mb-2">{destination}</p>
            {distance && duration && (
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {distance}
                </span>
                <span>{duration}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-gray-900">
              Real-Time Location & Route Sharing
            </p>
            <p className="text-xs text-gray-600">
              {isTracking 
                ? "Your location and route to destination are being shared. All participants can see each other's routes."
                : "Click 'Start Tracking' to share your location and route with other trip members."}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Each participant's route is shown in their unique color on the map.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
