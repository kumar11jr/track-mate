import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function createUser(name:string,email:string,password:string){
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    try{
        const user = await prisma.user.create({
            data:{
                name,
                email,
                hashedPassword,
                salt
            },
        });
        return user;
    }catch(error){
        console.error("Database Error: ",error);
        throw new Error('Error creating user');
    }
}

export async function getAllUser(){
    return prisma.user.findMany();
}


export async function getUserByEmail(email:string){
    return prisma.user.findUnique({
        where:{email}
    })
}


export async function verifyUser(email:string,password:string){
    const user = await prisma.user.findUnique({
        where:{email}
    })

    if(!user) return null;
    const isPasswordValid = await bcrypt.compare(password,user.hashedPassword);
    if(!isPasswordValid) return null;
    return user;
}


export async function logoutUser(){
    (await cookies()).delete("auth_token");
    return {success:true,message:"Logged out successfully"};
}


