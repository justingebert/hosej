import Header from "@/components/ui/custom/Header";

export default function TermsPage() {
    return (
        <>
            <Header href={`/help`} />
            <div style={{ padding: '20px', lineHeight: '1.6' }}>
                <h1>Terms of Service</h1>
                <p><strong>Last updated:</strong> 2024/10/27</p>

                <h2>Welcome to HoseJ!</h2>
                <p>These Terms of Service (&quotTerms&quot) govern your use of our app (&quotApp&quot), and by using or accessing our App, you agree to comply with these Terms. Please read them carefully. If you do not agree with these Terms, please do not use our App.</p>

                <h2>1. Acceptance of Terms</h2>
                <p>By accessing or using HoseJ, you agree to these Terms, along with our Privacy Policy, which is incorporated into these Terms. If you do not agree, you may not use the App.</p>

                <h2>2. Who Can Use the App</h2>
                <p>Our App is available only to users over the age of 18. By using this App, you confirm that you meet this age requirement.</p>

                <h2>3. User Accounts and Login Options</h2>
                <p>You may use our App:</p>
                <ul>
                    <li><strong>Without an Account:</strong> In this case, your usage will be bound to the device on which you installed the app. No personal data, beyond a username you may provide, is collected or shared.</li>
                    <li><strong>With a Google Account:</strong> By choosing to log in with your Google account, you enable multi-device access, allowing you to use the App across different devices. In this case, we collect and store only your Google ID.</li>
                </ul>
                <p>For more information on how we handle your data, please see our Privacy Policy.</p>

                <h2>4. User Responsibilities</h2>
                <p>When using the App, you agree:</p>
                <ul>
                    <li>To comply with these Terms and any applicable laws or regulations.</li>
                    <li>Not to use the App for any illegal or unauthorized purpose.</li>
                    <li>Not to engage in any activity that disrupts or interferes with the App’s functionality or security.</li>
                </ul>

                <h2>5. Intellectual Property Rights</h2>
                <p>All content, design, and functionality within the App are the intellectual property of HoseJ and are protected by copyright and other intellectual property laws. You may not copy, distribute, or create derivative works from any part of the App without our prior written consent.</p>

                <h2>6. Limitation of Liability</h2>
                <p>To the extent permitted by law:</p>
                <ul>
                    <li><strong>We are not liable</strong> for any indirect, incidental, or consequential damages arising from your use of the App, including, but not limited to, loss of data or damage to your device.</li>
                    <li>The App is provided “as-is” without any warranties of any kind, either express or implied, regarding its accuracy, reliability, or availability.</li>
                </ul>

                <h2>7. Disclaimer of Warranties</h2>
                <p>We strive to keep our App safe, secure, and functioning properly, but we cannot guarantee continuous or error-free operation. Your use of the App is at your own risk, and you agree that the App is provided &quotas-is&quot and &quotas available.&quot</p>

                <h2>8. Modification and Termination</h2>
                <p>We reserve the right to modify, suspend, or terminate the App or your access to the App at any time, for any reason, without notice or liability. We may also update these Terms from time to time, and the latest version will always be available within the App. By continuing to use the App after any changes, you agree to be bound by the updated Terms.</p>

                <h2>9. Governing Law and Jurisdiction</h2>
                <p>These Terms are governed by and construed in accordance with the laws of Germany, without regard to its conflict of laws provisions. Any disputes arising from or related to these Terms shall be resolved in the courts of Germany.</p>

                <h2>10. Contact Us</h2>
                <p>If you have any questions about these Terms or need further assistance, please contact us at:</p>
                <address>
                    {/* <strong>[Your Company Name]</strong><br /> */}
                    {/* Email: <br /> */}
                </address>
            </div>
        </>
    );
}
