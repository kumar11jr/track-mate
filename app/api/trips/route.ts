import { NextResponse } from "next/server";
import { PrismaClient } from "@/app/generated/prisma";
import {sendInviteEmail} from "@/lib/email";
import { getCurrentUser } from "@/lib/auth";

const prisma = new PrismaClient();


export async function POST(req:Request){
    try{
        const { destination, friendEmails } = await req.json();

        // destination is required; friendEmails is optional. creatorId is derived from auth
        if(!destination){
            return NextResponse.json(
                {error: "Missing required fields"},
                {status: 400}
            );
        }

        const currentUser = await getCurrentUser();
        if(!currentUser){
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const trip = await prisma.trip.create({
            data:{
                destination,
                creatorId: currentUser.id
            },
        });

        await prisma.participant.create({
            data:{
                tripId: trip.id,
                userId: currentUser.id,
                status: "ACCEPTED"
            },
        }); 

        const validEmails = Array.isArray(friendEmails)
            ? friendEmails.filter((email: string) => Boolean(email && email.trim() !== ''))
            : [];

        for(const email of validEmails){
            const invitedUser = await prisma.user.findUnique({
                where:{email: email.trim()},
            });

            if(invitedUser){
                const participant = await prisma.participant.create({
                    data:{
                        tripId:trip.id,
                        userId:invitedUser.id,
                        status:"PENDING"
                    }
                });

                await sendInviteEmail (
                    invitedUser.email,
                    invitedUser.name,
                    trip,
                    participant.id
                );
            }else{
                console.log(`User with email ${email} not found`);

                // this is will only work if the user is registered with us otherwise not.
            }
        }

        const completeTrip = await prisma.trip.findUnique({
            where:{id:trip.id},
            include:{
                creator:{
                    select:{id:true,name:true,email:true}
                },
                participants:{
                    include:{
                        user:{
                            select:{id:true,name:true,email:true}
                        }
                    }
                }
            }
        })
        return NextResponse.json({
            success:true,
            trip:completeTrip,
            message:"Trip created and invitations sent"
        })
    }catch(err){
        console.error("Error creating trip: ",err);
        return NextResponse.json(
            {error: "Failed to create trip"},
            {status: 500}
        )  
    }
}