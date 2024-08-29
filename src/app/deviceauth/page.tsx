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
  const [deviceID, setDeviceId] = useState("");


  const handleStart = async () => {
    await localStorage.setItem("deviceId", deviceID);
    router.push("/");
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
          type="text"
          placeholder="DeviceId"
          value={deviceID}
          onChange={(e) => setDeviceId(e.target.value)}
          className="w-full max-w-sm text-center"
        />

        <div className="space-y-4 w-full max-w-sm">
          <Button
            onClick={handleStart}
            className="w-full"
            disabled={!deviceID}
          >
            Start
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
