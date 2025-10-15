"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPlus, MapPin, Map, Loader2 } from "lucide-react";
import AutoCompleteSearch from "@/components/autoCompleteSearch";
import GoogleMapsDirections from "@/components/GoogleMapsDirections";
import { toast } from "sonner";

interface SelectedPlace {
  place_id: string;
  address: string;
  lat?: number;
  lng?: number;
}

export default function CreateTripPage() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [friends, setFriends] = useState([""]);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddFriend = () => {
    if (friends.length < 2) {
      setFriends([...friends, ""]);
    }
  };

  const handleFriendChange = (index: number, value: string) => {
    const updated = [...friends];
    updated[index] = value;
    setFriends(updated);
  };

  const handlePlaceSelect = (place: SelectedPlace) => {
    setDestination(place.address);
    setSelectedPlace(place);
    console.log("Selected place:", place);
  };

  const handleShowDirections = () => {
    if (selectedPlace) {
      setShowMap(true);
    }
  };

  const handleSubmit = async () => {
    // Validate destination
    if (!selectedPlace || !destination) {
      toast.error("Please select a destination");
      return;
    }

    // Filter out empty email fields
    const validFriends = friends.filter(f => f.trim() !== '');

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validFriends.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.warning('Please enter valid email addresses');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destination: selectedPlace.address,
          friendEmails: validFriends,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create trip');
      }

      toast.success(`Trip created! Invitations sent to ${validFriends.length} friend(s).`);

      // Redirect to trip details or dashboard
      router.push(`/trips/${data.trip.id}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      toast.error("Failed to create trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              Create a New Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="destination">Search Destination</Label>
              <AutoCompleteSearch onPlaceSelect={handlePlaceSelect} />
              {selectedPlace && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="text-sm text-green-600 flex-1">
                    ✓ Selected: {selectedPlace.address}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleShowDirections}
                    className="flex items-center gap-1"
                  >
                    <Map className="h-4 w-4" />
                    Show Directions
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Invite Friends (max 2)</Label>
              <p className="text-sm text-gray-500">
                Friends must have an account to receive invitations
              </p>
              {friends.map((friend, idx) => (
                <Input
                  key={idx}
                  type="email"
                  placeholder="Enter friend's email"
                  value={friend}
                  onChange={(e) => handleFriendChange(idx, e.target.value)}
                  className="mb-2"
                  disabled={loading}
                />
              ))}
              {friends.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddFriend}
                  className="flex items-center gap-1"
                  disabled={loading}
                >
                  <UserPlus className="h-4 w-4" />
                  Add Friend
                </Button>
              )}
            </div>

            <Button 
              variant="default" 
              className="w-full" 
              onClick={handleSubmit}
              disabled={loading || !selectedPlace}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Trip...
                </>
              ) : (
                "Create Trip"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Map */}
        {showMap && selectedPlace && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-blue-500" />
                Directions to {selectedPlace.address.split(',')[0]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleMapsDirections
                destination={selectedPlace}
                onClose={() => setShowMap(false)}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}