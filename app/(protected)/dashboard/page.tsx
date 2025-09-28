
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
// import { useRouter } from "next/navigation";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    // const router = useRouter();

    // const handleCreateTrip = () => {
    //   // naviagate to create trip page
    //   router.push("/create-trip");
    // }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="default">Create New Trip</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>My Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            <li>
              🚗 Trip to Taj Mahal – 2 Participants
              <Button variant="outline" size="sm" className="ml-2">View</Button>
            </li>
          </ul>
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
  );
}
