import { PrismaClient } from "@/app/generated/prisma";
import { NextResponse } from "next/server";


const prisma = new PrismaClient();

export async function GET(
    req:Request,
    {params}:{params:{participantId:string}}
){
    try{
        const participant = await prisma.participant.findUnique({
            where:{id:params.participantId},
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


        if(participant.status==="PENDING"){
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
    {params}:{params:{participantId:string}}
){
    try{
        const {action,userId} = await req.json();

        if(!["ACCEPT","REJECT"].includes(action)){
            return NextResponse.json(
                {error:"Invalid action"},
                {status:400}
            );
        }

        const participant = await prisma.participant.findUnique({
            where:{id:params.participantId},
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

        if(participant.id!==userId){
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

        const newStatus = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
        
        const updatedParticipant = await prisma.participant.update({
            where: { id: params.participantId },
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
            message: `Invitation ${action}ed  successfully`,
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