import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import LogoutComponent from "@/components/logoutComponent";
import Link from "next/link";
// import { useRouter } from "next/navigation";
import { getUserTrips } from "@/services/userService";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    // const router = useRouter();

    // const handleCreateTrip = () => {
    //   // naviagate to create trip page
    //   router.push("/create-trip");
    // }

    const tripsData = await getUserTrips(user?.id as string)

  return (    
    <div className="p-6">
      <div className="mb-6 flex justify-end">
        <LogoutComponent />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="default">
            <Link href="/create-trip">Create New Trip</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>My Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {!tripsData || tripsData.length === 0 ? (
              <div className="text-sm text-muted-foreground">No trips yet.</div>
            ) : (
              <ul className="space-y-2">
                {tripsData.map((trip) => (
                  <li key={trip.id} className="flex items-center justify-between">
                    <div>
                      🚗 {trip.destination} – {trip.participants.length} Participants
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/trips/${trip.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li>
                🎉 Invited by Ankit – Trip to Jaipur
                <Button variant="default" size="sm" className="ml-2">Accept</Button>
                <Button variant="destructive" size="sm" className="ml-2">Reject</Button>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
