'use client';

import React, { useState, useEffect } from 'react';
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

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
        <div className={`w-full max-w-md transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Budget Pig" className="w-32 h-32 mx-auto mb-6 drop-shadow-lg" />
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Verify Your Email</h1>
            <p className="text-slate-600 text-lg">Enter the 6-digit OTP sent to {email}</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10">
            <div className="space-y-8">
              {otpError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                  {otpError}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">Enter OTP</p>
                <div className="flex gap-3 justify-center">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className={`w-14 h-14 text-center text-3xl font-bold border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-200 ${
                        otpError ? 'border-red-300' : 'border-gray-200'
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
                className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
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
                      className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200"
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
                  className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200"
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className={`w-full max-w-md transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Budget Pig" className="w-32 h-32 mx-auto mb-6 drop-shadow-lg" />
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-600 text-lg">Start managing your budget today</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10">
          <form onSubmit={handleRegisterSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
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
              className="text-lg"
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="text-lg"
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
              className="text-lg"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              className="text-lg"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full py-4 text-lg font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create Account
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors duration-200"
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