import BackLink from "@/components/ui/custom/BackLink";
import Header from "@/components/ui/custom/Header";

export default function TermsPage() {
    return (
        <>
            <Header leftComponent={<BackLink href={`/help`} />} title={"Terms"} />

            <div className="max-w-2xl mx-auto space-y-6 text-sm leading-relaxed">
                {/* Alpha Banner */}
                <div className="rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-600 p-3 text-yellow-800 dark:text-yellow-200 text-xs">
                    <strong>Alpha software.</strong> hosej is an experimental side project. The
                    service may change, go offline, or lose data at any time without notice.
                </div>

                <div>
                    <h1 className="text-2xl font-bold mb-1">Terms of Service</h1>
                    <p className="text-xs text-muted-foreground">
                        Last updated: {new Date().toISOString().split("T")[0]}
                    </p>
                </div>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">1. The Service</h2>
                    <p>
                        hosej is a personal side project by Justin (&quot;we&quot;, &quot;us&quot;,
                        &quot;the developer&quot;), an individual developer based in Berlin,
                        Germany. It is not a registered business. The service is provided free of
                        charge.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">2. Alpha Status</h2>
                    <p>hosej is in alpha. This means:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>The app may be unstable, buggy, or unavailable at any time</li>
                        <li>Features may be added, changed, or removed without notice</li>
                        <li>Your data may be deleted or reset at any time</li>
                        <li>The service may be shut down at any time without notice</li>
                    </ul>
                    <p>Use hosej for testing and personal enjoyment only.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">3. Who Can Use hosej</h2>
                    <p>
                        hosej is available only to users aged 16 or older. By using the app, you
                        confirm you meet this requirement.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">4. User Accounts</h2>
                    <p>You may use hosej:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Without a Google account</strong> — access is tied to your
                            device via a device credential. No personally identifiable information
                            is required.
                        </li>
                        <li>
                            <strong>With a Google account</strong> — enables cross-device access. We
                            store your Google ID, name, and profile picture.
                        </li>
                    </ul>
                    <p>See our Privacy Policy for full details on data handling.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">5. Your Responsibilities</h2>
                    <p>By using hosej, you agree to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Use the service only for lawful purposes</li>
                        <li>
                            Not upload or share content that is illegal, harmful, abusive,
                            harassing, defamatory, or that violates the rights of others
                        </li>
                        <li>
                            Not attempt to reverse-engineer, hack, or interfere with the service or
                            its infrastructure
                        </li>
                        <li>
                            Not use the service in any way that could damage, disable, or overburden
                            it
                        </li>
                        <li>Be responsible for all content you submit</li>
                    </ul>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">6. Content Ownership</h2>
                    <p>
                        You retain ownership of content you upload or create on hosej. By submitting
                        content, you grant us a non-exclusive, royalty-free license to store,
                        display, and distribute your content solely to operate the service. We will
                        not use your content for commercial purposes.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">7. Intellectual Property</h2>
                    <p>
                        The hosej application code, design, and interface are the intellectual
                        property of the developer and are protected by applicable copyright law. You
                        may not copy, distribute, or create derivative works without prior written
                        consent.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">8. Disclaimer of Warranties</h2>
                    <p>
                        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
                        WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
                        TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
                        NON-INFRINGEMENT. YOUR USE OF HOSEJ IS ENTIRELY AT YOUR OWN RISK.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">9. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE DEVELOPER SHALL NOT
                        BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
                        DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE HOSEJ, INCLUDING LOSS
                        OF DATA, LOSS OF PROFITS, OR UNAUTHORIZED ACCESS TO YOUR ACCOUNT. THE
                        DEVELOPER&apos;S TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED EUR 0
                        (ZERO).
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">10. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your access to hosej at any
                        time, for any reason, without notice or liability. We may also discontinue
                        the service entirely at any time.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">11. Changes to These Terms</h2>
                    <p>
                        We may update these Terms at any time. The &quot;Last updated&quot; date at
                        the top will reflect changes. Continued use of hosej after changes
                        constitutes acceptance of the updated Terms.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">12. Governing Law</h2>
                    <p>
                        These Terms are governed by the laws of Germany. Any disputes shall be
                        subject to the exclusive jurisdiction of the courts of Berlin, Germany.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">13. Severability</h2>
                    <p>
                        If any provision of these Terms is found to be unenforceable, the remaining
                        provisions shall remain in full force and effect.
                    </p>
                </section>

                <section className="space-y-2">
                    <h2 className="text-base font-semibold">14. Contact</h2>
                    <p>
                        For questions about these Terms, contact:
                        <br />
                        <strong>Justin</strong> —{" "}
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
