import { logoutUser } from "@/services/userService";

export async function POST(){
    try{
        const response = await logoutUser();
        return new Response(JSON.stringify(response),{status:200});
    }catch(error){
        console.error("Logout Error: ",error);
        return new Response("Logout failed", { status: 500 });
    }
}