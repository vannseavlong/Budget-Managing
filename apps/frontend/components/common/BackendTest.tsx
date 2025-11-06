/**
 * Backend Connectivity Test Component
 * Use this to debug API connection issues
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function BackendTest() {
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnections = async () => {
    setIsLoading(true);
    setResult('Testing backend connectivity...\n');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Test 1: Check if backend is running
    try {
      const response = await fetch(`${apiUrl}/api/v1/telegram/debug-no-auth`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        setResult(
          (prev) =>
            prev + `✅ Backend is running: ${JSON.stringify(data, null, 2)}\n\n`
        );
      } else {
        setResult(
          (prev) =>
            prev +
            `❌ Backend responded with error: ${response.status} ${response.statusText}\n\n`
        );
      }
    } catch (error) {
      setResult((prev) => prev + `❌ Backend connection failed: ${error}\n\n`);
    }

    // Test 2: Check Google auth endpoint
    try {
      const response = await fetch(`${apiUrl}/api/v1/auth/google`, {
        method: 'GET',
      });

      if (response.ok) {
        setResult((prev) => prev + `✅ Google auth endpoint is accessible\n\n`);
      } else {
        setResult(
          (prev) =>
            prev +
            `❌ Google auth endpoint error: ${response.status} ${response.statusText}\n\n`
        );
      }
    } catch (error) {
      setResult(
        (prev) => prev + `❌ Google auth endpoint failed: ${error}\n\n`
      );
    }

    // Test 3: Check environment variables
    setResult((prev) => prev + `🔍 Frontend API URL: ${apiUrl}\n`);
    setResult((prev) => prev + `🔍 NODE_ENV: ${process.env.NODE_ENV}\n`);

    setIsLoading(false);
  };

  return (
    <div className="p-6 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Backend Connectivity Test</h3>

      <Button onClick={testConnections} disabled={isLoading} className="mb-4">
        {isLoading ? 'Testing...' : 'Test Backend Connection'}
      </Button>

      {result && (
        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
          {result}
        </div>
      )}
    </div>
  );
}
