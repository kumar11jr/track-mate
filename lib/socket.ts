import {Server as SocketIOServer} from "socket.io";
import {Server as HTTPServer} from "http";
import {PrismaClient} from "@/app/generated/prisma";

const prisma = new PrismaClient();

let io:SocketIOServer | null = null;

export function initializeSocket(server:HTTPServer){
    io = new SocketIOServer(server,{
        cors:{
            origin:"*",
            methods:["GET","POST"],
            credentials:true,
        }
    });

    io.on("connection",(socket)=>{
        console.log("A user connected", socket.id);

        socket.on("join-trip",async (data:{tripId:string,userId:string})=>{
            const {tripId,userId} = data;
            const participant = await prisma.participant.findFirst({
                where:{
                    tripId,
                    userId,
                    status:"ACCEPTED"
                }
            });


            if(participant){
                socket.join(`trip-${participant.id}`);
                socket.emit("joined-trip",{tripId,success:true});
                console.log(`User ${userId} joined trip ${tripId}`);
            }else{
                socket.emit("joined-error",{tripId,success:false,error:"You are not a participant of this trip"});
            }
        });

        socket.on("location-update",async (data:{
            tripId:string,
            participantId:string,
            userId:string,
            latitude:number,
            longitude:number,
            accuracy?:number,
            heading?:number,
            speed?:number
        })=>{
            const {tripId,participantId,userId,...locationData} = data;
            const participant = await prisma.participant.findFirst({
                where:{
                    id:participantId,
                    tripId,
                    userId,
                    status:"ACCEPTED"
                }
            });
            
            if(participant){
                socket.to(`trip-${participant.id}`).emit("participant-location",{
                    participantId,
                    userId,
                    ...locationData,
                    timestamp:new Date().toISOString()
                });
            }
        });


        socket.on("disconnect",()=>{
            console.log("A user disconnected", socket.id);
        });
    });
    return io;
}


export function getIO(){
    if(!io){
        throw new Error("Socket.io not initialized");
    }
    return io;
}