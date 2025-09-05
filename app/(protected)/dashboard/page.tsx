"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
    <div>

      {alert && (
        <Alert variant="destructive">
          <Terminal />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components and dependencies to your app using the cli.
          </AlertDescription>
        </Alert>
      )}



      Hello from initial page
      <Button variant={"destructive"} onClick={handleClick}>Click me</Button>
    </div>

    
  );
}
