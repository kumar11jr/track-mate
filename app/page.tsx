import LocationTester from "@/testing/LocationTester";

export default function Home() {

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
