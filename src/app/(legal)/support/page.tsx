import Link from "next/link";
import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

const SUPPORT_EMAIL = "pregame_acid_9o@icloud.com";

export default function SupportPage() {
    return (
        <>
            <Header leftComponent={<BackLink href={`/`} />} title={"Support"} />

            <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
                <div>
                    <h1 className="text-2xl font-bold mb-1">HoseJ Support</h1>
                    <p className="text-muted-foreground">
                        Help, bug reports, safety issues, and account questions for HoseJ.
                    </p>
                </div>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">Contact</h2>
                    <p>
                        Email{" "}
                        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-primary">
                            {SUPPORT_EMAIL}
                        </a>{" "}
                        for support. Please include what happened, your device, and the group name
                        if the issue is group-related.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">Bug Reports</h2>
                    <p>
                        Send the steps to reproduce, what you expected, what actually happened, and
                        screenshots if they help. HoseJ is still in active development, so small
                        issues are expected.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">Safety and Abuse</h2>
                    <p>
                        HoseJ groups are invite-only. Group admins can remove members from group
                        settings. To report abusive content or a user, email support with the group
                        name, the user name, and a short description of the issue.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">Account and Data</h2>
                    <p>
                        You can delete your account in the app settings. For privacy requests,
                        account recovery, or data questions, contact support from the email address
                        above.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">Legal</h2>
                    <p className="flex gap-4">
                        <Link href="/terms" className="underline text-primary">
                            Terms
                        </Link>
                        <Link href="/privacy" className="underline text-primary">
                            Privacy Policy
                        </Link>
                    </p>
                </section>
            </div>
        </>
    );
}
