"use client"

import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import autoComplete from '@/lib/google';
import { loadGoogleMapsScript } from '@/lib/loadGoogleMapsScript';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';

type GeocoderResult = {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  [key: string]: any;
}

type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';

interface SelectedPlace {
  place_id: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface AutoCompleteSearchProps {
  onPlaceSelect?: (place: SelectedPlace) => void;
}

const AutoCompleteSearch = ({ onPlaceSelect }: AutoCompleteSearchProps): React.JSX.Element => {
    const [input, setInput] = useState('');
    const [predictions, setPredictions] = useState<PlaceAutocompleteResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initGoogleMaps = async () => {
            try {
                const response = await fetch('/api/maps-key');
                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error);
                }

                await loadGoogleMapsScript(data.apiKey);
            } catch (error) {
                console.error('Error loading Google Maps:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initGoogleMaps();
    }, []);

    useEffect(() => {
        if (input.trim().length < 2) {
            setPredictions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const results = await autoComplete(input);
                setPredictions(results);
            } catch (error) {
                console.error('Error fetching predictions:', error);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [input]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handlePredictionClick = async (prediction: any) => {
        setInput(prediction.description);
        setPredictions([]);
        
        try {
            const geocoder = new window.google.maps.Geocoder();
            const result = await new Promise<GeocoderResult>((resolve, reject) => {
                geocoder.geocode(
                    { placeId: prediction.place_id },
                    (results: GeocoderResult[] | null, status: GeocoderStatus) => {
                        if (status === "OK" && results && results[0]) {
                            resolve(results[0]);
                        } else {
                            reject(new Error('Failed to get place details'));
                        }
                    }
                );
            });

            const location = (result as any).geometry.location;
            
            const selectedPlace: SelectedPlace = {
                place_id: prediction.place_id,
                address: prediction.description,
                lat: location.lat(),
                lng: location.lng()
            };
            
            console.log("Selected place with coordinates:", selectedPlace);
            
            if (onPlaceSelect) {
                onPlaceSelect(selectedPlace);
            }
        } catch (error) {
            console.error('Error getting place details:', error);
            const selectedPlace: SelectedPlace = {
                place_id: prediction.place_id,
                address: prediction.description
            };
            if (onPlaceSelect) {
                onPlaceSelect(selectedPlace);
            }
        }
    };

    return (
        <div className="relative">
            <Input 
                type='text' 
                value={input}
                onChange={handleInputChange}
                placeholder='Type a place (e.g., Taj Mahal, Agra)' 
            />
            
            {predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto z-10">
                    {predictions.map((prediction: any) => (
                        <div 
                            key={prediction.place_id}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handlePredictionClick(prediction)}
                        >
                            {prediction.description}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AutoCompleteSearch;