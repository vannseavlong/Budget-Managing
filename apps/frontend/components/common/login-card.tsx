'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

export function LoginCard() {
  const { login, isLoading } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      // You might want to show a toast notification here
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] space-y-6 border border-gray-200 p-8 rounded-lg shadow-lg bg-white">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Image
            src="/images/MMS-Logo.png"
            alt="MMS Logo"
            width={500}
            height={500}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          MMMS - Budget Tracking !
        </h1>
        <p className="text-gray-600">Manage, Track, Alert</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-sm font-medium text-gray-900"
          >
            Username/Phone
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="@SNLRLONG"
            className="w-full bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            disabled={isLoading || isGoogleLoading}
          />
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Image
              src="/icons/Google.svg"
              alt="Google"
              width={20}
              height={20}
              className="object-contain"
            />
          )}
          {isGoogleLoading ? 'Redirecting...' : 'Continue with Google'}
        </Button>
      </div>

      {/* Terms and Privacy */}
      <div className="text-center text-sm text-gray-500">
        By continuing, you agree to our{' '}
        <a href="#" className="underline hover:text-gray-700">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="underline hover:text-gray-700">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
