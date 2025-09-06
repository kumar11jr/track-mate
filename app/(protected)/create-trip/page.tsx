"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserPlus, MapPin } from "lucide-react";

export default function CreateTripPage() {
  const [destination, setDestination] = useState("");
  const [friends, setFriends] = useState([""]);

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

  const handleSubmit = () => {
    // later: call /api/trips with Prisma
    console.log({ destination, friends });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-500" />
            Create a New Trip
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Destination Search */}
          <div className="space-y-2">
            <Label htmlFor="destination">Search Destination</Label>
            <Input
              id="destination"
              placeholder="Type a place (e.g., Taj Mahal, Agra)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Start typing to search for a place. (Later connect with Google Places API)
            </p>
          </div>

          {/* Add Friends */}
          <div className="space-y-2">
            <Label>Invite Friends (max 2)</Label>
            {friends.map((friend, idx) => (
              <Input
                key={idx}
                placeholder="Enter friend's email"
                value={friend}
                onChange={(e) => handleFriendChange(idx, e.target.value)}
                className="mb-2"
              />
            ))}
            {friends.length < 2 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddFriend}
                className="flex items-center gap-1"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </Button>
            )}
          </div>

          {/* Submit */}
          <Button variant="default" className="w-full" onClick={handleSubmit}>
            Create Trip
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
