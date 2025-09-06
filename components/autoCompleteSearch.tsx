"use client"

import React, {useRef,useEffect} from 'react';
import { Input } from './ui/input';

const AutoCompleteSearch = ():React.JSX.Element =>{
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(()=>{
        if(!window.google || !inputRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current,{
            fields:["place_id","geometry","name","formatted_address"],
            types:["geocode"]
        });


        autocomplete.addListener("place_changed",()=>{
            const place: google.maps.place.PlaceResult = autocomplete.getPlace();

            if(!place.geometry || !place.geometry.location){
                console.error("No details available for input: '"+ place.name + "'");
                return;
            }

            console.log("Selected place:",{
                address: place.formatted_address,
                lat:place.geometry.location.lat(),
                lng:place.geometry.location.lng()
            });
        })
    },[]);

    return (
        <Input ref={inputRef} type='text' placeholder='Type a place (e.g., Taj Mahal, Agra)'/> 
    );
}

export default AutoCompleteSearch;