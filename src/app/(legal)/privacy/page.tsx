import Header from "@/components/ui/Header";

export default function PrivacyPage() {
    return (
        <>
            <Header href={`/help`} />
            <div style={{ padding: '20px', lineHeight: '1.6' }}>
                <h1>Privacy Policy</h1>
                <p><strong>Last updated:</strong> 2024/10/27</p>
                
                <h2>Introduction</h2>
                <p>Welcome to HoseJ! Your privacy is very important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our web application ("App"). We comply with the General Data Protection Regulation (GDPR) and other applicable privacy laws.</p>
                
                <h2>1. Information We Collect</h2>
                
                <h3>Personal Data</h3>
                <p>We collect only the data you provide based on your usage preference:</p>
                <ul>
                    <li><strong>Using the App Without an Account:</strong> If you choose to use the app without logging in, no personally identifiable information is collected. The app is only accessible on the device on which it was installed and will retain locally stored data, such as the username you may provide within the app, which is saved on your device alone.</li>
                    <li><strong>Using the App with a Google Login:</strong> If you choose to connect with your Google account, we collect your <strong>Google ID</strong>. This allows us to enable cross-device access, so you can use the app on multiple devices while keeping your data and app settings consistent. No additional information from your Google account, such as your email or other profile data, is collected.</li>
                </ul>
                
                <h3>Automatically Collected Data</h3>
                <p>No other personal data is automatically collected. We do not use cookies, analytics, or tracking tools in the app.</p>
                
                <h2>2. How We Use Your Data</h2>
                <p>The data we collect is used solely for these purposes:</p>
                <ul>
                    <li><strong>User Identification and Login:</strong> If you use the app without an account, we identify your app session based solely on the device installation. If you log in with Google, we use your Google ID to enable secure, multi-device access to your account.</li>
                    <li><strong>Functionality:</strong> We use either the locally stored username or Google ID (if logged in) to recognize you within the app and to provide a customized experience.</li>
                </ul>
                
                <h2>3. Legal Basis for Processing Personal Data</h2>
                <p>We collect and process data based on your <strong>consent</strong>:</p>
                <ul>
                    <li>By choosing to enter a username and using the app without logging in, you consent to us saving it locally on your device.</li>
                    <li>By choosing to log in with Google, you consent to the collection and use of your Google ID for account management and multi-device functionality.</li>
                </ul>
                
                <h2>4. Data Storage and Security</h2>
                <p>We take your data security seriously. When a username is provided without Google login, it is stored only on your device. For Google login users, your Google ID is securely stored on our servers to enable cross-device functionality. We use industry-standard security measures to protect this data.</p>
                
                <h2>5. User Rights Under GDPR</h2>
                <p>If you are located in the European Union, you have certain rights regarding your personal data:</p>
                <ul>
                    <li><strong>Right to Access:</strong> You may request a copy of the data we hold about you.</li>
                    <li><strong>Right to Rectification:</strong> You may request correction of any inaccurate data.</li>
                    <li><strong>Right to Erasure:</strong> You may request deletion of your locally stored username or Google ID.</li>
                    <li><strong>Right to Restrict Processing:</strong> You may request restricted processing in certain cases.</li>
                    <li><strong>Right to Data Portability:</strong> You may request a copy of your Google ID in a machine-readable format.</li>
                    <li><strong>Right to Withdraw Consent:</strong> You may withdraw your consent at any time by contacting us.</li>
                </ul>
                
                <h2>6. Data Sharing and Third-Party Services</h2>
                <p>We do not share any personal data with third parties. The app may use Vercel as a hosting provider, which does not process personal data beyond hosting. No tracking, cookies, or analytics are used.</p>
                
                <h2>7. Use of Cookies</h2>
                <p>Our App does not use cookies or similar tracking technologies for analytics, advertising, or any non-essential purpose.</p>
                
                <h2>8. International Data Transfers</h2>
                <p>Our servers may be located outside your country of residence, which may involve transferring your personal data across borders. We ensure compliance with GDPR through safeguards to protect your data.</p>
                
                <h2>9. Privacy of Minors</h2>
                <p>Our App is not intended for individuals under the age of 18. We do not knowingly collect data from children. If we learn that we have collected data from a child under 18, we will delete it promptly.</p>
                
                <h2>10. Changes to This Privacy Policy</h2>
                <p>We may update this Privacy Policy periodically. The latest version will always be available on this page, with the effective date noted at the top. If we make significant changes, we will notify you via email or a notice on our App.</p>
                
                <h2>11. Contact Us</h2>
                <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at:</p>
                <address>
                   {/*  <strong>[Your Company Name]</strong><br /> */}
                    {/* Email: <br /> */}
                    {/* Address: [Your Company Address] */}
                </address>
            </div>
        </>
    );
}
