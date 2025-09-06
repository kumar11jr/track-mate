"use client"

import { Button } from "./ui/button";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function LogoutComponent() {

    const [showAlertDialog, setShowAlertDialog] = useState(false); 
    const [isLoading,setIsLoading] = useState(false);   

    const router = useRouter();
    const handleLogOut = async() =>{
        setIsLoading(true);
    try{
        const response = await fetch('api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },  
        })
        const result = await response.json();
        if(response.ok && result.success){
            setShowAlertDialog(false);
            router.push("/login");
            router.refresh();
        }else{
            console.error("Logout failed:", result.message || "Unknown error");
        }
    }catch(error){
        console.error("Logout Error: ",error);
    }finally{
        setIsLoading(false);
    }
  }


    return(
       <>
       <AlertDialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will log you out of your account. You&apos;ll need to sign in again to access your dashboard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowAlertDialog(false)} disabled={isLoading}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogOut} disabled={isLoading}>
                            {isLoading ? "Logging out..." : "Continue"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
       

        <Button onClick={() => setShowAlertDialog(true)} variant={"default"}>LogOut</Button>
       </>

        
    )
}