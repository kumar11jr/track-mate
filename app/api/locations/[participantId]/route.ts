import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();

// Update location for a participant
export async function POST(
  req: Request,
  context: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await context.params;
    const { latitude, longitude, accuracy, heading, speed } = await req.json();

    // Validate required fields
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the participant exists and belongs to the current user
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: { user: true },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    if (participant.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this participant's location" },
        { status: 403 }
      );
    }

    // Create new location entry
    const location = await prisma.location.create({
      data: {
        participantId,
        latitude,
        longitude,
        accuracy: accuracy || null,
        heading: heading || null,
        speed: speed || null,
      },
    });

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 }
    );
  }
}

// Get latest location for a participant
export async function GET(
  req: Request,
  context: { params: Promise<{ participantId: string }> }
) {
  try {
    const { participantId } = await context.params;

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        locations: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      participant,
      latestLocation: participant.locations[0] || null,
    });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 }
    );
  }
}
