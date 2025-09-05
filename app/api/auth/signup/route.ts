import signUpSchema from "@/app/schemas/signUpSchema";
import { createUser, getUserByEmail } from "@/services/userService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request:NextRequest){
    try{
        const body = await request.json();

        const validateBody = signUpSchema.parse(body);
        const {name,email,password} = validateBody;

        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if(existingUser){
            return NextResponse.json({
                success:false,
                message:"User with this email already exists"
            });
        }

        // create new user
        const user = await createUser(name,email,password);

        return NextResponse.json({
            success:true,
            message:"User created successfully",
            data:user
        });
    }catch(error){
        console.error("Signup Error: ",error);
        return NextResponse.json({
            success:false,
            message:"Error creating user",
            error:error instanceof Error ? error.message : "Unknown error"
        },{
            status:400
        });
    }
}