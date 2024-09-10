"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { motion } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { set } from "mongoose";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true); 
  const { toast } = useToast();

  const groupId = searchParams.get("groupId");

  useEffect(() => {
    setLoading(true);
    if (session?.user) {
      const callbackUrl = groupId ? `/join/${groupId}` : "/groups";
      router.push(callbackUrl);
      setLoading(false); 
      return;
    }  

    const deviceId = localStorage.getItem("deviceId");
    if (deviceId) {
      const callbackUrl = groupId ? `/join/${groupId}` : '/groups';
      signIn('credentials', {
        redirect: false,
        deviceId: deviceId,
        callbackUrl: callbackUrl,
      }).then(result => {
        if (result?.ok) {
          console.log('Device ID authentication successful');
          router.push('/groups');
        } else {
          console.error('Device ID authentication failed:', result?.error);
          console.log(result);  // Log the full result object for more context
          setLoading(false); // Stop loading if authentication fails
        }
      }).catch(error => {
        console.error('Error during device ID authentication:', error);
        setLoading(false); // Stop loading on error
      });
    } else {
      console.warn('No device ID found in localStorage');
      setLoading(false); // Stop loading if no device ID found
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
      signIn('google', { callbackUrl: '/groups' }).catch(error => {
        console.error('Google sign-in error:', error);
      });
  };

  
  const handleEmailSignIn = () => {
    signIn('google', { callbackUrl: '/groups' }).catch(error => {
      console.error('Google sign-in error:', error);
    });
};

  const createUserByDeviceId = async (userName: string) => {
    const deviceId = uuidv4();

    try {
      console.log(deviceId, userName);
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId, userName }),
      });
      if (response.ok) {;
        localStorage.setItem('deviceId', deviceId);
        const callbackUrl = groupId ? `/join/${groupId}` : '/groups'; // Redirect to group join page if groupId exists
        router.push(callbackUrl);
      } else {
        console.error('Failed to create user:', await response.text());
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleStartWithoutAccount = async () => {
    if(!userName) {
      toast({ title: "Please Enter your name!" });
      return;
    }
    try {
      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
        await createUserByDeviceId(userName);
      }

      const callbackUrl = groupId ? `/join/${groupId}` : '/groups';
      const result = await signIn('credentials', {
        redirect: false,
        deviceId: deviceId,
        callbackUrl: callbackUrl,
      });

      if (result?.ok) {
        console.log('Device ID authentication successful');
        router.push(callbackUrl);
      } else {
        console.error('Device ID authentication failed:', result?.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error during device ID authentication:', error);
      setLoading(false);
    }
  };

  // Render the loading state if the app is still authenticating
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.h1
          className="text-4xl font-bold text-center relative"
          style={{
            backgroundImage: "linear-gradient(90deg, var(--shine-color) 0%, var(--shine-highlight) 50%, var(--shine-color) 100%)",
            backgroundSize: "200% 100%",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
          animate={{
            backgroundPosition: ["-100% 0", "100% 0"],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        >
          HoseJ
        </motion.h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between min-h-screen ">
      <header className="text-center p-6">
        <Link href={"/deviceauth"}>
          <h1 className="text-4xl font-bold">HoseJ</h1>
        </Link>
      </header>

      <main className="flex flex-col items-center justify-center flex-grow space-y-6">
        <Input
          style={{ fontSize: '16px' }}
          type="text"
          placeholder="What's your name?"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          className="w-full max-w-sm text-center"
        />

        <div className="space-y-4 w-full max-w-sm">
        <Button
            onClick={handleStartWithoutAccount}
            variant="secondary"
            className="w-full"
          >
            Start without Account
          </Button>
          <Button onClick={handleGoogleSignIn} className="w-full" >
            Continue with Google
          </Button>
{/*           <Button onClick={handleGoogleSignIn} className="w-full" disabled={true} >
            Continue with Email
          </Button> */}
        </div>
      </main>

      <footer className="text-center p-4">
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
