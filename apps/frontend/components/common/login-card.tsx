'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { otpAuthService } from '@/lib/otp-auth-service';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export function LoginCard() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  
  // Email/Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP verification state
  const [sessionToken, setSessionToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      setError('Google login failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setIsEmailLoading(true);
      setError('');
      
      const response = await otpAuthService.login({ email, password });
      
      if (response.success && response.data) {
        setSessionToken(response.data.sessionToken);
        setSuccessMessage('OTP sent to your Telegram! Please check your messages.');
        setShowOtpInput(true);
      } else if (response.requiresTelegramLink) {
        setError('Please link your Telegram account first. Login with Google to set up.');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode) {
      setError('Please enter the OTP code');
      return;
    }

    try {
      setIsEmailLoading(true);
      setError('');
      
      const response = await otpAuthService.verifyOTP({ sessionToken, otpCode });
      
      if (response.success && response.data) {
        // Store tokens
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        setSuccessMessage('Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setError(response.message || 'OTP verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setIsEmailLoading(false);
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

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Email/Password Login Form */}
      <form onSubmit={handleSendOTP} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-900">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white border-gray-300 text-gray-900"
            disabled={isEmailLoading || showOtpInput}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-900">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900 pr-10"
              disabled={isEmailLoading || showOtpInput}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {!showOtpInput && (
          <Button
            type="submit"
            disabled={isEmailLoading}
            className="w-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isEmailLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending OTP...
              </div>
            ) : (
              'Send OTP'
            )}
          </Button>
        )}
      </form>

      {/* OTP Input Section with Animation */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          showOtpInput ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={handleOTPVerify} className="space-y-4 pt-2">
          <div className="text-center space-y-2 pb-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Check your Telegram</h3>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to your Telegram account
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otpCode" className="text-sm font-medium text-gray-900">
              OTP Code
            </Label>
            <Input
              id="otpCode"
              type="text"
              placeholder="123456"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full bg-white border-gray-300 text-gray-900 text-center text-2xl tracking-widest"
              disabled={isEmailLoading}
              maxLength={6}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isEmailLoading || otpCode.length !== 6}
            className="w-full bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isEmailLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </div>
            ) : (
              'Login'
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowOtpInput(false);
                setOtpCode('');
                setSuccessMessage('');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Didn't receive code? Try again
            </button>
          </div>
        </form>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      {/* Continue with Google */}
      <Button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
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

      {/* Terms and Privacy */}
      <div className="text-center text-sm text-gray-500">
        By continuing, you agree to our{' '}
        <a
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Terms of Service
        </a>{' '}
        and{' '}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-gray-700"
        >
          Privacy Policy
        </a>
        .
      </div>
    </div>
  );
}
