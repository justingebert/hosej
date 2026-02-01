import Header from "@/components/ui/custom/Header";
import cat from "/public/cat.jpg";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import BackLink from "@/components/ui/custom/BackLink";

export default function HelpPage() {
    return (
        <>
            <Header leftComponent={<BackLink href={`/groups`} />} title={"Help"} />
            <Image src={cat} alt="cat" className="rounded-lg" />
            <p>This is a private app in development </p>
            <div className="flex flex-row justify-between my-6">
                <Link href={"/terms"}>
                    <Button variant="secondary">Terms of Service</Button>
                </Link>
                <Link href={"/privacy"}>
                    <Button variant="secondary">Privacy Policy</Button>
                </Link>
            </div>
        </>
    );
}
