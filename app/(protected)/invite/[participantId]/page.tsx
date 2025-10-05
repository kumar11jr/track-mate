// app/invite/[participantId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, User, Calendar, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvitationData {
  id: string;
  status: string;
  trip: {
    id: string;
    destination: string;
    createdAt: string;
    creator: {
      name: string;
      email: string;
    };
  };
  user: {
    name: string;
    email: string;
  };
}

export default function InvitePage() {
  const router = useRouter();
  const params = useParams();
  const participantId = params.participantId as string;

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitation();
  }, [participantId]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${participantId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load invitation');
      }

      setInvitation(data.invitation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (action: 'accept' | 'reject') => {
    setResponding(true);

    try {
      // Get current user ID from your auth system
      // const session = await getSession();
      // const userId = session?.user?.id;
      const userId = "YOUR_USER_ID"; // Replace with actual user ID from auth

      const response = await fetch(`/api/invitations/${participantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} invitation`);
      }

      if(action === 'accept'){
        toast.success("Invitation accepted! 🎉");
      }else{
        toast.success("Invitation declined");
      }

      // Redirect based on action
      if (action === 'accept') {
        router.push(`/trips/${invitation?.trip.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error(`Failed to ${action} invitation`);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-gray-600">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  // Show if already processed
  if (invitation.status !== 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {invitation.status === 'ACCEPTED' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Already Accepted
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Already Declined
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You have already {invitation.status.toLowerCase()} this invitation.
            </p>
            <Button 
              onClick={() => router.push(invitation.status === 'ACCEPTED' ? `/trips/${invitation.trip.id}` : '/dashboard')} 
              className="w-full"
            >
              {invitation.status === 'ACCEPTED' ? 'View Trip' : 'Go to Dashboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardTitle className="text-2xl">🌍 Trip Invitation</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Destination</p>
                <p className="text-xl font-semibold">{invitation.trip.destination}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Invited by</p>
                <p className="font-medium">{invitation.trip.creator.name}</p>
                <p className="text-sm text-gray-500">{invitation.trip.creator.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Trip Created</p>
                <p className="font-medium">
                  {new Date(invitation.trip.createdAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-gray-700 mb-6">
              {invitation.trip.creator.name} has invited you to join their trip to{' '}
              <span className="font-semibold">{invitation.trip.destination}</span>.
              Would you like to accept this invitation?
            </p>

            <div className="flex gap-4">
              <Button
                onClick={() => handleResponse('accept')}
                disabled={responding}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {responding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Invitation
                  </>
                )}
              </Button>

              <Button
                onClick={() => handleResponse('reject')}
                disabled={responding}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                {responding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Decline
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}