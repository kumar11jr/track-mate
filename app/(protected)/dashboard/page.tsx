// import LogoutComponent from "@/components/logoutComponent";
import { getCurrentUser } from "@/lib/auth";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
    const user = await getCurrentUser();
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="default">Create New Trip</Button>
        </CardContent>
      </Card>

      {/* My Trips */}
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

      {/* Invitations */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            <li>
              🎉 Invited by Ankit – Trip to Jaipur
              <Button variant="secondary" size="sm" className="ml-2">Accept</Button>
              <Button variant="destructive" size="sm" className="ml-2">Reject</Button>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
