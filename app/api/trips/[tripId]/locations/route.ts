import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// Get all participant locations for a trip
export async function GET(
  req: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await context.params;

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a participant in this trip
    const participant = await prisma.participant.findFirst({
      where: {
        tripId,
        userId: currentUser.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this trip" },
        { status: 403 }
      );
    }

    // Get all participants with their latest locations
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        participants: {
          where: {
            status: "ACCEPTED", // Only show accepted participants
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            locations: {
              orderBy: { timestamp: "desc" },
              take: 1, // Get only the latest location
            },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found" },
        { status: 404 }
      );
    }

    // Format the response
    const participantLocations = trip.participants.map((p) => ({
      participantId: p.id,
      userId: p.userId,
      userName: p.user.name,
      userEmail: p.user.email,
      latestLocation: p.locations[0] || null,
    }));

    return NextResponse.json({
      tripId: trip.id,
      destination: trip.destination,
      participantLocations,
    });
  } catch (error) {
    console.error("Error fetching trip locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip locations" },
      { status: 500 }
    );
  }
}
