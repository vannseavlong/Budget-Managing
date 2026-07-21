'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { API_ENDPOINTS } from '@/lib/api-config';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export function SignupCard() {
  const { login, isLoading } = useAuth();
  
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Form state for OTP/register submission
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [showPostSignupModal, setShowPostSignupModal] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState(''); // Track registered email

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation for UI feedback
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // Clear error and call OTP register endpoint
    setError('');
    try {
      setIsGoogleLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const resp = await fetch(`${baseUrl}/api/v1/otp-auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username: username || email.split('@')[0], password }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        // Registration successful! Save email and show modal for next steps
        setRegistrationEmail(email);
        setShowPostSignupModal(true);
        setError(''); // Clear any previous errors
      } else {
        setError(data.message || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error', err);
      setError('Signup failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      
      // If user just registered, complete the Google setup flow
      if (registrationEmail) {
        // This will trigger OAuth and then call complete-google-setup endpoint
        await login(); // Triggers Google OAuth
        
        // After OAuth completes, we need to call the complete-google-setup endpoint
        // This should be handled in the OAuth callback
      } else {
        // Direct Google signup (no email/password registration)
        await login(); // This triggers Google OAuth
      }
    } catch (error) {
      console.error('Google signup failed:', error);
      setError('Google signup failed. Please try again.');
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
          Create Your Account
        </h1>
        <p className="text-gray-600">Start managing your budget today</p>
      </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-900">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            placeholder="preferred username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-white border-gray-300 text-gray-900"
            disabled={isLoading || isGoogleLoading}
            required
          />
        </div>
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSignup} className="space-y-4">
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
            disabled={isLoading || isGoogleLoading}
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
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900 pr-10"
              disabled={isLoading || isGoogleLoading}
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border-gray-300 text-gray-900 pr-10"
              disabled={isLoading || isGoogleLoading}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
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
            {isGoogleLoading ? 'Redirecting...' : 'Sign Up'}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or</span>
        </div>
      </div>

      {/* Continue with Google Button */}
      <Button
        type="button"
        onClick={handleGoogleSignup}
        disabled={isLoading || isGoogleLoading}
        className="w-full flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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

      {/* Post-signup modal prompting next steps */}
      {showPostSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-green-700">✓ Account Created!</h3>
            <p className="text-sm text-gray-600 mt-3">
              Your account has been registered successfully! To complete your setup:
            </p>
            <ol className="text-sm text-gray-700 mt-3 space-y-2 list-decimal list-inside">
              <li>Link your Telegram account for OTP authentication (optional but recommended)</li>
              <li>Verify your Google account to create your budget spreadsheet</li>
            </ol>
            <p className="text-sm text-gray-600 mt-3">
              Click below to verify with Google and create your spreadsheet now, or do it later from your profile.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setShowPostSignupModal(false);
                  // Redirect to login or dashboard
                  window.location.href = '/login';
                }}
              >
                I'll do it later
              </Button>
              <Button 
                onClick={() => { 
                  setShowPostSignupModal(false); 
                  handleGoogleSignup(); 
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Verify with Google Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Already have an account */}
      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-slate-800 hover:text-slate-600 underline"
        >
          Login here
        </Link>
      </div>

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
