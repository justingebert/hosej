"use client";

import Header from "@/components/ui/custom/Header";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BackLink from "@/components/ui/custom/BackLink";
import PWAInstallButton from "@/components/common/PWAInstallButton";

export default function HelpPage() {
    return (
        <>
            <Header leftComponent={<BackLink href={`/groups`} />} title={"Help"} />

            <div className="flex flex-col items-center justify-center gap-6 max-w-sm mx-auto">
                <Image
                    src="/cat.jpg"
                    alt="cat"
                    width={500}
                    height={500}
                    className="rounded-xl"
                    priority
                />

                <p className="text-center text-muted-foreground text-sm">
                    This is a private app in development
                </p>

                <PWAInstallButton />

                <div className="flex gap-3 w-full">
                    <Link href={"/terms"} className="flex-1">
                        <Button variant="secondary" className="w-full">
                            Terms of Service
                        </Button>
                    </Link>
                    <Link href={"/privacy"} className="flex-1">
                        <Button variant="secondary" className="w-full">
                            Privacy Policy
                        </Button>
                    </Link>
                </div>
            </div>
        </>
    );
}
