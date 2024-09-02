"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/components/UserContext";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { createUserByDeviceId, migrateUser  } = useUser();
  const [userName, setUserName] = useState("");


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      migrateUser(storedUser).then(() => {
        console.log('User migrated successfully');
        localStorage.removeItem('user'); // Clean up old user data
      }).catch(error => {
        console.error('Error migrating user:', error);
      });
    }
  }, [migrateUser]);

  useEffect(() => {
    const deviceId = localStorage.getItem("deviceId");
    if (deviceId) {
      signIn('credentials', {
        redirect: false,
        deviceId: deviceId,
      }).then(result => {
        if (result?.ok) {
          console.log('Device ID authentication successful');
          router.push('/groups');
        } else {
          console.error('Device ID authentication failed:', result?.error);
          console.log(result);  // Log the full result object for more context
        }
      }).catch(error => {
        console.error('Error during device ID authentication:', error);
      });
    } else {
      console.warn('No device ID found in localStorage');
    }
  }, [router]);

  
  const handleGoogleSignIn = () => {
    alert("coming soon!")
    // Store the username locally before starting Google OAuth
    //localStorage.setItem("userName", userName);
    //signIn("google", { callbackUrl: "/" }); // Adjust callback URL as needed
  };

  const handleStartWithoutAccount = async () => {
    try {
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = uuidv4(); // Generate a new deviceId if not present
        localStorage.setItem("deviceId", deviceId);
        await createUserByDeviceId(userName); // Create a new user if not already done
      }

      const result = await signIn('credentials', {
        redirect: false,
        deviceId: deviceId, // Pass the deviceId here
      });

      if (result?.ok) {
        console.log('Device ID authentication successful');
        router.push('/groups'); // Redirect to groups after successful sign-in
      } else {
        console.error('Device ID authentication failed:', result?.error);
      }
    } catch (error) {
      console.error('Error during device ID authentication:', error);
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-screen ">
      <header className="text-center p-6">
        <Link href={"/deviceauth"}>
          <h1 className="text-4xl font-bold" >HoseJ</h1>
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center flex-grow space-y-6">
      <Input
          style={{
            fontSize: '16px', 
          }}
          type="text"
          placeholder="What's your name?"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full max-w-sm text-center"
        />

        <div className="space-y-4 w-full max-w-sm">
          <Button onClick={handleGoogleSignIn} className="w-full" disabled={true}>
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
