"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
//import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/components/UserContext";

export default function Home() {
  const router = useRouter();
  const { createUserByDeviceId } = useUser();
  const [userName, setUserName] = useState("");

  const handleGoogleSignIn = () => {
    alert("coming soon!")
    // Store the username locally before starting Google OAuth
    //localStorage.setItem("userName", userName);

    //signIn("google", { callbackUrl: "/" }); // Adjust callback URL as needed
  };

  const handleStartWithoutAccount = async () => {
    if (userName) {
      await createUserByDeviceId(userName);
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen ">
      <header className="text-center p-6">
        <h1 className="text-4xl font-bold">HoseJ</h1>
      </header>

      <main className="flex flex-col items-center justify-center flex-grow space-y-6">
      <Input
          type="text"
          placeholder="What's your name?"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full max-w-sm text-center"
        />

        <div className="space-y-4 w-full max-w-sm">
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={!userName}>
            Continue with Google
          </Button>
          <Button
            onClick={handleStartWithoutAccount}
            variant="outline"
            className="w-full"
            disabled={!userName}
          >
            Start without Account
          </Button>
        </div>
      </main>

      {/* Footer Section with Legal Notice */}
      <footer className="text-center p-4 ">
        <p className="text-sm text-muted">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
