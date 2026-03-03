import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

export default function PrivacyPage() {
    return (
        <>
            <Header leftComponent={<BackLink href={`/help`} />} title={"Privacy"} />

            <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
                {/* Alpha Banner */}
                <div className="rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-600 p-3 text-yellow-800 dark:text-yellow-200 text-xs">
                    <strong>Alpha software.</strong> hosej is an experimental side project. Data may
                    be reset or deleted at any time without notice.
                </div>

                <div>
                    <h1 className="text-2xl font-bold mb-1">Privacy Policy</h1>
                    <p className="text-xs text-muted-foreground">
                        Last updated: {new Date().toISOString().split("T")[0]}
                    </p>
                </div>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">1. Who We Are</h2>
                    <p>
                        hosej is a personal side project by Justin, an individual developer based in
                        Berlin, Germany. It is not a registered company or commercial entity.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">2. Data We Collect</h2>

                    <h3 className="font-medium">Data you provide</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Display name or username</li>
                        <li>Profile photo (if uploaded)</li>
                        <li>
                            Content you create: questions, answers, photos, chat messages, jukebox
                            submissions
                        </li>
                        <li>
                            Google account information (name, email, profile picture) — only if you
                            sign in with Google
                        </li>
                    </ul>

                    <h3 className="font-medium mt-2">Collected automatically</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            Device credentials for passwordless authentication (a device-bound
                            identifier stored in our database)
                        </li>
                        <li>
                            Firebase Cloud Messaging (FCM) tokens — stored to deliver push
                            notifications you have opted into
                        </li>
                        <li>
                            Session cookies set by NextAuth to keep you logged in across page loads
                        </li>
                        <li>Basic server logs and error traces</li>
                    </ul>

                    <h3 className="font-medium mt-2">What we do NOT collect</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Payment or financial information</li>
                        <li>Precise GPS location</li>
                        <li>Contacts or address book</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">3. How We Use Your Data</h2>
                    <p>We use your data solely to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Operate the hosej service and authenticate your device or account</li>
                        <li>Display your profile and content to members of your group</li>
                        <li>Send push notifications you have opted into</li>
                    </ul>
                    <p>
                        We do not sell, rent, or share your personal data with any third party for
                        marketing or commercial purposes.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">4. Third-Party Services</h2>
                    <p>hosej relies on the following third-party services:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Google OAuth</strong> — optional sign-in (Google LLC)
                        </li>
                        <li>
                            <strong>Firebase Cloud Messaging</strong> — push notifications (Google
                            LLC)
                        </li>
                        <li>
                            <strong>Amazon S3</strong> — photo and media storage (Amazon Web
                            Services)
                        </li>
                        <li>
                            <strong>MongoDB Atlas</strong> — database hosting
                        </li>
                        <li>
                            <strong>Vercel</strong> — application hosting and edge infrastructure
                        </li>
                    </ul>
                    <p>
                        Each provider has its own privacy policy which we encourage you to review.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">5. Cookies</h2>
                    <p>
                        hosej uses session cookies set by NextAuth solely to maintain your login
                        state. We do not use cookies for advertising, analytics, or tracking.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">6. Data Retention</h2>
                    <p>
                        We retain your data for as long as your account exists and the service is
                        operational. During the alpha phase, data may be deleted at any time as part
                        of resets, migrations, or maintenance — potentially without prior notice.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">7. Data Security</h2>
                    <p>
                        We use HTTPS encryption in transit and apply standard access controls on our
                        database. However, as alpha software operated by an individual developer, we
                        cannot guarantee the security of your data. Use hosej at your own risk.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">8. Your Rights (GDPR)</h2>
                    <p>
                        If you are in the European Economic Area, you have the following rights
                        under the GDPR:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Right to access the personal data we hold about you</li>
                        <li>Right to correct inaccurate data</li>
                        <li>Right to erasure (&quot;right to be forgotten&quot;)</li>
                        <li>Right to restrict processing</li>
                        <li>Right to data portability</li>
                        <li>Right to withdraw consent at any time</li>
                    </ul>
                    <p>
                        To exercise any of these rights, contact us at the address below. As this is
                        a personal project, responses may take up to 30 days.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">9. Minors</h2>
                    <p>
                        hosej is not intended for individuals under 16. We do not knowingly collect
                        personal data from children. If you believe a child has provided data,
                        contact us and we will delete it promptly.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">10. Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy as the product evolves. The &quot;Last
                        updated&quot; date at the top will reflect any changes. Continued use of
                        hosej constitutes acceptance of the updated policy.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">11. Contact</h2>
                    <p>
                        For privacy questions or to exercise your GDPR rights, contact:
                        <br />
                        <strong>Justin </strong> —{" "}
                        <a
                            href="mailto:pregame_acid_9o@icloud.com"
                            className="underline text-primary"
                        >
                            pregame_acid_9o@icloud.com
                        </a>
                    </p>
                </section>
            </div>
        </>
    );
}
