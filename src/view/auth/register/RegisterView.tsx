'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useRegister } from '@/hooks/auth/mutations/useRegister';
import { useVerifyOtp } from '@/hooks/auth/mutations/useVerifyOtp';
import { ApiError } from '@/utils/api';

export function RegisterView() {
  const router = useRouter();
  const registerMutation = useRegister();
  const verifyOtpMutation = useVerifyOtp();

  // Registration form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // OTP verification states
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
      });

      setShowOTPVerification(true);
      setCanResend(false);
      setResendCountdown(60);

      // Start resend countdown
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('User already exists');
      } else {
        setError('Failed to register. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    setOtpError('');
    setIsLoading(true);

    try {
      await verifyOtpMutation.mutateAsync({
        email,
        otp: otpCode,
      });

      // Auto sign in after successful verification
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setOtpError('Registration successful, but login failed. Please sign in manually.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setOtpError('Too many failed attempts. Please register again.');
        } else if (err.data && typeof err.data === 'object' && 'attemptsRemaining' in err.data) {
          const attemptsRemaining = (err.data as { attemptsRemaining: number }).attemptsRemaining;
          setAttemptsRemaining(attemptsRemaining);
          setOtpError(`Invalid OTP. ${attemptsRemaining} attempts remaining.`);
        } else {
          setOtpError('Invalid OTP. Please try again.');
        }
      } else {
        setOtpError('Failed to verify OTP. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setCanResend(false);
    setResendCountdown(60);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setOtpError(data.error || 'Failed to resend OTP');
        return;
      }

      setOtpError('');

      // Start countdown
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setOtpError('Failed to resend OTP. Please try again.');
    }
  };

  if (showOTPVerification) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Budget Pig" className="w-20 h-20 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-slate-800">Verify Your Email</h1>
            <p className="text-slate-500 mt-2">Enter the 6-digit OTP sent to {email}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
            <div className="space-y-6">
              {otpError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                  {otpError}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Enter OTP</p>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className={`w-12 h-12 text-center text-2xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-colors ${
                        otpError ? 'border-rose-300' : 'border-gray-200'
                      }`}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerifyOTP}
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full"
                disabled={otp.some((d) => !d)}
              >
                Verify OTP
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-600">
                  Didn&apos;t receive the code?{' '}
                  {canResend ? (
                    <button
                      onClick={handleResendOTP}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-slate-500">
                      Resend in {resendCountdown}s
                    </span>
                  )}
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowOTPVerification(false);
                    setOtp(['', '', '', '', '', '']);
                    setOtpError('');
                    setError('');
                  }}
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  Back to Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Budget Pig" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-2">Start managing your budget today</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-8">
          <form onSubmit={handleRegisterSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={isLoading}
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              helperText="Minimum 6 characters"
              required
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}