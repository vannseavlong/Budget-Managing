export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Terms of Service for Budget Manager
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Last Updated: November 8, 2025
        </p>

        <div className="prose prose-gray max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using Budget Manager (&quot;the Service&quot;), you
            accept and agree to be bound by these Terms of Service
            (&quot;Terms&quot;). If you do not agree to these Terms, please do
            not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Budget Manager is a personal budget management application that:
          </p>
          <ul>
            <li>Allows you to manage your budget and expenses</li>
            <li>Stores your data in your own Google Drive</li>
            <li>Integrates with Google Sheets for data storage</li>
            <li>Optionally integrates with Telegram for notifications</li>
          </ul>

          <h2>3. User Accounts</h2>
          <h3>3.1 Google Authentication</h3>
          <ul>
            <li>You must have a Google account to use the Service</li>
            <li>You must sign in using Google OAuth</li>
            <li>
              You are responsible for maintaining the security of your Google
              account
            </li>
          </ul>

          <h3>3.2 Account Responsibilities</h3>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate information</li>
            <li>Keep your login credentials secure</li>
            <li>Notify us of any unauthorized access</li>
            <li>Use the Service in compliance with these Terms</li>
          </ul>

          <h2>4. Data and Privacy</h2>
          <h3>4.1 Your Data</h3>
          <ul>
            <li>Your budget data is stored in YOUR Google Drive</li>
            <li>You own all data you create in Budget Manager</li>
            <li>We do NOT store your budget data on our servers</li>
            <li>You can export or delete your data at any time</li>
          </ul>

          <h3>4.2 Privacy</h3>
          <ul>
            <li>
              Your use of the Service is subject to our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>We respect your privacy and data ownership</li>
            <li>We do not sell or share your personal information</li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree NOT to:</p>
          <ul>
            <li>❌ Use the Service for illegal purposes</li>
            <li>❌ Attempt to hack or disrupt the Service</li>
            <li>❌ Share your account with others</li>
            <li>❌ Use automated tools to access the Service</li>
            <li>❌ Reverse engineer the application</li>
            <li>❌ Upload malicious content or viruses</li>
          </ul>

          <h2>6. Google Drive Integration</h2>
          <h3>6.1 Permissions</h3>
          <p>The Service requests access to:</p>
          <ul>
            <li>Create and manage spreadsheets in your Google Drive</li>
            <li>Read and write data to your Budget Manager spreadsheet</li>
          </ul>

          <h3>6.2 Data Storage</h3>
          <ul>
            <li>A spreadsheet will be created in your Google Drive</li>
            <li>You can delete this spreadsheet at any time</li>
            <li>Deleting the spreadsheet will delete all your budget data</li>
          </ul>

          <h3>6.3 Revocation</h3>
          <p>You can revoke access at any time by:</p>
          <ul>
            <li>
              Visiting{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Account Permissions
              </a>
            </li>
            <li>Removing Budget Manager from authorized apps</li>
          </ul>

          <h2>7. Service Availability</h2>
          <h3>7.1 No Warranty</h3>
          <p>
            The Service is provided &quot;AS IS&quot; without warranties of any
            kind.
          </p>

          <h3>7.2 Availability</h3>
          <ul>
            <li>We strive for 99% uptime but do not guarantee it</li>
            <li>Maintenance may cause temporary service interruptions</li>
            <li>
              We will provide notice of scheduled maintenance when possible
            </li>
          </ul>

          <h2>8. Limitation of Liability</h2>
          <p>
            We are not liable for data loss, service interruptions, or
            third-party service failures. Our maximum liability is limited to
            the amount you paid for the Service (currently $0 as it&apos;s
            free).
          </p>

          <h2>9. Open Source</h2>
          <p>
            Budget Manager is open source under the MIT License. View source
            code at:{' '}
            <a
              href="https://github.com/vannseavlong/Budget-Managing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              GitHub Repository
            </a>
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Changes will be effective
            immediately upon posting. Continued use constitutes acceptance of
            changes.
          </p>

          <h2>11. Contact Information</h2>
          <p>For questions about these Terms:</p>
          <ul>
            <li>
              Email:{' '}
              <a
                href="mailto:seavlongvann55@gmail.com"
                className="text-blue-600 hover:underline"
              >
                seavlongvann55@gmail.com
              </a>
            </li>
            <li>
              GitHub:{' '}
              <a
                href="https://github.com/vannseavlong/Budget-Managing"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Budget-Managing
              </a>
            </li>
          </ul>

          <hr className="my-8" />

          <p className="text-center text-sm text-gray-600">
            <strong>
              By using Budget Manager, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service.
            </strong>
          </p>

          <hr className="my-8" />

          <p className="text-sm text-gray-600">
            <strong>Budget Manager</strong>
            <br />
            Developed by Seav Long Vann
            <br />
            Email:{' '}
            <a
              href="mailto:seavlongvann55@gmail.com"
              className="text-blue-600 hover:underline"
            >
              seavlongvann55@gmail.com
            </a>
            <br />
            GitHub:{' '}
            <a
              href="https://github.com/vannseavlong/Budget-Managing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              vannseavlong/Budget-Managing
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
