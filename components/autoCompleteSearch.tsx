"use client"

import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import autoComplete from '@/lib/google';
import { PlaceAutocompleteResult } from '@googlemaps/google-maps-services-js';

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

    const handlePredictionClick = (prediction: any) => {
        setInput(prediction.description);
        setPredictions([]);
        
        const selectedPlace: SelectedPlace = {
            place_id: prediction.place_id,
            address: prediction.description
        };
        
        console.log("Selected place:", selectedPlace);
        
        // Call the callback if provided
        if (onPlaceSelect) {
            onPlaceSelect(selectedPlace);
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