export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Privacy Policy for Budget Manager
        </h1>
        <p className="text-sm text-gray-600 mb-8">
          Last Updated: November 8, 2025
        </p>

        <div className="prose prose-gray max-w-none">
          <h2>Introduction</h2>
          <p>
            Budget Manager (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
            is committed to protecting your privacy. This Privacy Policy
            explains how we collect, use, and safeguard your information when
            you use our Budget Manager application.
          </p>

          <h2>Information We Collect</h2>

          <h3>1. Google Account Information</h3>
          <p>When you sign in with Google, we collect:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Profile picture</li>
            <li>Google account ID</li>
          </ul>

          <h3>2. Google Drive Data</h3>
          <p>We access your Google Drive to:</p>
          <ul>
            <li>Create a personal spreadsheet for your budget data</li>
            <li>Store your budget information in YOUR Google Drive</li>
            <li>
              Your data stays in YOUR Google Drive - we do NOT store it on our
              servers
            </li>
          </ul>

          <h3>3. Usage Data</h3>
          <p>We may collect:</p>
          <ul>
            <li>Device information (browser type, operating system)</li>
            <li>Usage patterns (features used, time spent)</li>
            <li>Error logs for debugging</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Authenticate you and provide access to the application</li>
            <li>Store your budget data in your own Google Drive</li>
            <li>Provide personalized budget management features</li>
            <li>Improve and optimize our services</li>
            <li>Send notifications (if you opt-in for Telegram integration)</li>
          </ul>

          <h2>Data Storage</h2>
          <p>
            <strong>IMPORTANT:</strong> Your budget data is stored ONLY in YOUR
            Google Drive spreadsheet. We do NOT store your budget data on our
            servers.
          </p>
          <p>What we store:</p>
          <ul>
            <li>✅ Authentication tokens (temporary, encrypted)</li>
            <li>✅ Session information (temporary)</li>
            <li>❌ NO budget data on our servers</li>
            <li>❌ NO financial information on our servers</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do NOT sell, trade, or rent your personal information to third
            parties.
          </p>
          <p>We may share information only:</p>
          <ul>
            <li>With your explicit consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
          </ul>

          <h2>Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul>
            <li>
              <strong>Google OAuth & Drive API:</strong> For authentication and
              data storage
            </li>
            <li>
              <strong>Vercel:</strong> For frontend hosting
            </li>
            <li>
              <strong>Render.com:</strong> For backend hosting
            </li>
            <li>
              <strong>Telegram (optional):</strong> For notifications (if you
              choose to connect)
            </li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your data</li>
            <li>Delete your data</li>
            <li>Revoke Google Drive access at any time</li>
            <li>Export your data from your Google Drive</li>
            <li>Request data deletion</li>
          </ul>
          <p>To exercise these rights:</p>
          <ul>
            <li>
              Revoke access: Visit{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Account Permissions
              </a>
            </li>
            <li>Delete data: Delete your spreadsheet from Google Drive</li>
            <li>
              Contact us:{' '}
              <a
                href="mailto:seavlongvann55@gmail.com"
                className="text-blue-600 hover:underline"
              >
                seavlongvann55@gmail.com
              </a>
            </li>
          </ul>

          <h2>Data Security</h2>
          <p>We implement security measures including:</p>
          <ul>
            <li>HTTPS encryption for all communications</li>
            <li>JWT token-based authentication</li>
            <li>Secure environment variable storage</li>
            <li>Regular security updates</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li>Authentication tokens: Expire after 7 days</li>
            <li>
              Budget data: Stored in YOUR Google Drive (you control retention)
            </li>
            <li>Session data: Cleared when you log out</li>
            <li>Logs: Retained for 30 days for debugging</li>
          </ul>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Budget Manager is not intended for children under 13. We do not
            knowingly collect information from children under 13.
          </p>

          <h2>Changes to Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            users of significant changes by:
          </p>
          <ul>
            <li>Posting the updated policy on our website</li>
            <li>Updating the &quot;Last Updated&quot; date</li>
          </ul>

          <h2>Contact Us</h2>
          <p>If you have questions about this Privacy Policy:</p>
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
              GitHub Issues:{' '}
              <a
                href="https://github.com/vannseavlong/Budget-Managing/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Budget-Managing Issues
              </a>
            </li>
          </ul>

          <h2>Consent</h2>
          <p>By using Budget Manager, you consent to this Privacy Policy.</p>

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
          </p>
        </div>
      </div>
    </div>
  );
}
