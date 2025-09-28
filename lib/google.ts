"use server";

import {Client} from "@googlemaps/google-maps-services-js"

const client = new Client();
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

const autoComplete = async(input:String)=>{
    if(!apiKey) throw new Error("Google Maps API Key not found");

    try {
        const response = await client.placeAutocomplete({
        params:{
            input:input as string,
            key:apiKey
        },
    });
        return response.data.predictions;
    } catch (error) {
        console.error("Error fetching autocomplete results:", error);
        throw error;
    }   
}

export default autoComplete;
