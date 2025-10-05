// app/api/trips/[tripId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// Get trip details with participants
export async function GET(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            status: 'asc', // ACCEPTED first, then PENDING, then REJECTED
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    // Separate participants by status
    const accepted = trip.participants.filter(p => p.status === 'ACCEPTED');
    const pending = trip.participants.filter(p => p.status === 'PENDING');
    const rejected = trip.participants.filter(p => p.status === 'REJECTED');

    return NextResponse.json({
      trip: {
        ...trip,
        stats: {
          total: trip.participants.length,
          accepted: accepted.length,
          pending: pending.length,
          rejected: rejected.length,
        },
        participantsByStatus: {
          accepted,
          pending,
          rejected,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching trip:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip details' },
      { status: 500 }
    );
  }
}

// Update trip (optional - for editing destination)
export async function PATCH(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const { destination, userId } = await req.json();

    // Verify user is the creator
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    if (trip.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the trip creator can update this trip' },
        { status: 403 }
      );
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: params.tripId },
      data: { destination },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      trip: updatedTrip,
    });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    );
  }
}

// Delete trip (optional)
export async function DELETE(
  req: Request,
  { params }: { params: { tripId: string } }
) {
  try {
    const { userId } = await req.json();

    // Verify user is the creator
    const trip = await prisma.trip.findUnique({
      where: { id: params.tripId },
    });

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      );
    }

    if (trip.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the trip creator can delete this trip' },
        { status: 403 }
      );
    }

    // Delete participants first (if not using cascade)
    await prisma.participant.deleteMany({
      where: { tripId: params.tripId },
    });

    // Delete trip
    await prisma.trip.delete({
      where: { id: params.tripId },
    });

    return NextResponse.json({
      success: true,
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    );
  }
}