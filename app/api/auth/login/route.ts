import loginSchema from "@/app/schemas/loginSchema";
import { verifyUser } from "@/services/userService";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import {SignJWT} from "jose"


const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "supersecret");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validateBody = loginSchema.parse(body);
    const { email, password } = validateBody;

    const user = await verifyUser(email, password);
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid email or password",
        }),
        { status: 401 }
      );
    }

    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2d")
      .sign(JWT_SECRET);

    (await cookies()).set("auth_token",token,{
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        path:"/",
        maxAge:60*60*24*2 // 2 days
    })

    return new Response(
      JSON.stringify({
        success: true,
        user,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Login Error: ", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}
