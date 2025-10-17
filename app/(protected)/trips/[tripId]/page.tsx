// app/trips/[tripId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Calendar, Users, Loader2, CheckCircle, Clock, XCircle } from "lucide-react";
import RealTimeTripMap from "@/components/RealTimeTripMap";
import { geocodeAddress } from "@/lib/geocode";

interface Participant {
  id: string;
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Trip {
  id: string;
  destination: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  stats: {
    total: number;
    accepted: number;
    pending: number;
    rejected: number;
  };
  participantsByStatus: {
    accepted: Participant[];
    pending: Participant[];
    rejected: Participant[];
  };
}

export default function TripDetailsPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat?: number; lng?: number }>({});

  useEffect(() => {
    fetchTripDetails();
    // Poll every 30 seconds to check for updated participant status
    const interval = setInterval(fetchTripDetails, 30000);
    return () => clearInterval(interval);
  }, [tripId]);

  // Geocode destination address
  useEffect(() => {
    if (trip?.destination) {
      console.log(`Geocoding destination: ${trip.destination}`);
      geocodeAddress(trip.destination).then((coords) => {
        if (coords) {
          console.log(`Destination coordinates received:`, coords);
          setDestinationCoords(coords);
        } else {
          console.error('Failed to geocode destination');
        }
      });
    }
  }, [trip?.destination]);

  const fetchTripDetails = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load trip');
      }

      setTrip(data.trip);

      // Find current user's participant ID
      const allParticipants = [
        ...data.trip.participantsByStatus.accepted,
        ...data.trip.participantsByStatus.pending,
        ...data.trip.participantsByStatus.rejected,
      ];

      // Fetch current user info
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setCurrentUserId(userData.user.id);

        // Find participant record for current user
        const userParticipant = allParticipants.find(
          (p: Participant) => p.user.id === userData.user.id
        );
        if (userParticipant) {
          setCurrentParticipantId(userParticipant.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="border-red-500 text-red-700"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">{error || 'Trip not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Trip Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="text-3xl flex items-center gap-3">
            <MapPin className="h-8 w-8" />
            {trip.destination}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Trip Creator</p>
                  <p className="font-semibold">{trip.creator.name}</p>
                  <p className="text-sm text-gray-500">{trip.creator.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(trip.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-purple-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Participants</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-green-500 text-green-700">
                      {trip.stats.accepted} Accepted
                    </Badge>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      {trip.stats.pending} Pending
                    </Badge>
                    {trip.stats.rejected > 0 && (
                      <Badge variant="outline" className="border-red-500 text-red-700">
                        {trip.stats.rejected} Declined
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-Time Map */}
      {currentUserId && currentParticipantId && (
        <Card>
          <CardContent className="pt-6">
            <RealTimeTripMap
              tripId={tripId}
              destination={trip.destination}
              destinationLat={destinationCoords.lat}
              destinationLng={destinationCoords.lng}
              currentUserId={currentUserId}
              currentParticipantId={currentParticipantId}
            />
          </CardContent>
        </Card>
      )}

      {/* Participants Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Accepted Participants */}
        {trip.participantsByStatus.accepted.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Confirmed Participants ({trip.participantsByStatus.accepted.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.participantsByStatus.accepted.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div>
                      <p className="font-medium">{participant.user.name}</p>
                      <p className="text-sm text-gray-500">{participant.user.email}</p>
                    </div>
                    {getStatusBadge(participant.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Participants */}
        {trip.participantsByStatus.pending.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-600">
                <Clock className="h-5 w-5" />
                Awaiting Response ({trip.participantsByStatus.pending.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.participantsByStatus.pending.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div>
                      <p className="font-medium">{participant.user.name}</p>
                      <p className="text-sm text-gray-500">{participant.user.email}</p>
                    </div>
                    {getStatusBadge(participant.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Declined Participants */}
        {trip.participantsByStatus.rejected.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Declined ({trip.participantsByStatus.rejected.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.participantsByStatus.rejected.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div>
                      <p className="font-medium">{participant.user.name}</p>
                      <p className="text-sm text-gray-500">{participant.user.email}</p>
                    </div>
                    {getStatusBadge(participant.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}