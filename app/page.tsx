"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import LocationTester from "@/testing/LocationTester";
import { Terminal } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const[alert,setAlert] = useState(false);

  const handleClick = () =>{
    setAlert(true);
    setTimeout(()=>{
      setAlert(false);
    },4000)
  }

  return (
    // <div>
    //   {alert && (
    //     <Alert variant="destructive">
    //       <Terminal />
    //       <AlertTitle>Heads up!</AlertTitle>
    //       <AlertDescription>
    //         You can add components and dependencies to your app using the cli.
    //       </AlertDescription>
    //     </Alert>
    //   )}
    //   This is only tesing page and can be removed anytime.
    //   <Button variant={"destructive"} onClick={handleClick}>Click</Button>
    // </div>

    <div className="min-h-screen bg-gray-50 py-8">
      <LocationTester />
    </div>
    
  );
}
