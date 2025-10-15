import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";


const prisma = new PrismaClient();

export async function GET(
    req:Request,
    context:{params:Promise<{participantId:string}>}
){
    try{
        const {participantId} = await context.params;
        const participant = await prisma.participant.findUnique({
            where:{id:participantId},
            include:{
                trip:{
                    include:{
                        creator:{
                            select:{
                                name:true,
                                email:true
                            }
                        }
                    }
                },
                user:{
                    select:{
                        name:true,
                        email:true
                    }
                }
            }
        });

        if(!participant){
            return NextResponse.json(
                {error:"Invitation not found"},
                {status:404}
            )
        }


        if(participant.status!=="PENDING"){
            return NextResponse.json(
            { 
                error: 'Invitation already processed',
                status: participant.status 
            },
                { status: 400 }
            );
        }

        return NextResponse.json({invitation:participant});
    }catch(error){
        console.error("Error fetching invitation: ",error);
        return NextResponse.json(
            {error: "Failed to fetch invitation"},
            {status:500}
        );
    }
}



export async function POST(
    req:Request,
    context:{params:Promise<{participantId:string}>}
){
    try{
        const {participantId} = await context.params;
        const {action} = await req.json();

        const normalizedAction = typeof action === 'string' ? action.toLowerCase() : '';
        if(!["accept","reject"].includes(normalizedAction)){
            return NextResponse.json(
                {error:"Invalid action"},
                {status:400}
            );
        }

        const currentUser = await getCurrentUser();
        if(!currentUser){
            return NextResponse.json({error:"Unauthorized"},{status:401});
        }

        const participant = await prisma.participant.findUnique({
            where:{id:participantId},
            include:{
                trip:true
            }
        });

        if(!participant){
            return NextResponse.json(
                {error:"Invitation not found"},
                {status:404}
            )
        }

        if(participant.userId!==currentUser.id){
            return NextResponse.json(
                {error:"Unauthorized action"},
                {status:403}
            )
        }

        if(participant && participant.status!=="PENDING"){
            return NextResponse.json(
            { 
                error: 'Invitation already processed',
                status: participant.status 
            },
                { status: 400 }
            );
        }

        const newStatus = normalizedAction === "accept" ? "ACCEPTED" : "REJECTED";
        
        const updatedParticipant = await prisma.participant.update({
            where: { id: participantId },
            data: { status: newStatus },
            include: {
                trip: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: `Invitation ${normalizedAction === 'accept' ? 'accepted' : 'rejected'} successfully`,
            participant: updatedParticipant
        })
    }catch(error){
        console.error("Error processing invitation: ",error);
        return NextResponse.json(
            {error: "Failed to process invitation"},
            {status:500}
        );
    }
}