import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "supersecret");

export async function getCurrentUser() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { userId } = payload;
    if (!userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    return user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}
