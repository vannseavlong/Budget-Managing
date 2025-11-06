'use client';

import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/lib/auth-service';
import { useState } from 'react';

export default function DebugTokenPage() {
  const { user, isAuthenticated } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGetToken = () => {
    const currentToken = authService.getToken();
    setToken(currentToken);
  };

  const handleCopyToken = async () => {
    if (token) {
      try {
        await navigator.clipboard.writeText(token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy token:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔧 Debug: JWT Token
          </h1>

          <div className="space-y-6">
            {/* Authentication Status */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">
                Authentication Status
              </h2>
              <p className="text-sm text-gray-600">
                Status:{' '}
                <span
                  className={`font-medium ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}
                >
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </p>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  User: {user.name} ({user.email})
                </p>
              )}
            </div>

            {/* Get Token Button */}
            <div>
              <button
                onClick={handleGetToken}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Current Token
              </button>
            </div>

            {/* Token Display */}
            {token && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">JWT Token</h3>
                  <button
                    onClick={handleCopyToken}
                    className={`px-3 py-1 text-sm rounded ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    } transition-colors`}
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                <div className="bg-white border rounded p-3 break-all text-sm font-mono text-gray-800">
                  {token}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use this token in the Authorization header:{' '}
                  <code>Bearer {token.substring(0, 20)}...</code>
                </p>
              </div>
            )}

            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                📚 How to Use This Token
              </h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Copy the token above</li>
                <li>2. In Postman/API client, add Authorization header:</li>
                <li className="ml-4 font-mono bg-white px-2 py-1 rounded">
                  Authorization: Bearer YOUR_TOKEN_HERE
                </li>
                <li>3. Make requests to protected endpoints like:</li>
                <li className="ml-4">• GET /api/v1/auth/profile</li>
                <li className="ml-4">• GET /api/v1/budgets</li>
                <li className="ml-4">• POST /api/v1/transactions</li>
              </ol>
            </div>

            {/* Navigation */}
            <div className="pt-4 border-t">
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Back to Login
              </a>
              {isAuthenticated && (
                <>
                  <span className="mx-2 text-gray-400">|</span>
                  <a
                    href="/dashboard"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Go to Dashboard →
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
