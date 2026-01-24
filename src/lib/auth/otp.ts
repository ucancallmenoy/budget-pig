import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(plainOTP: string, hashedOTP: string): Promise<boolean> {
  return bcrypt.compare(plainOTP, hashedOTP);
}

export function getOTPExpirationTime(): Date {
  // OTP expires in 10 minutes
  return new Date(Date.now() + 10 * 60 * 1000);
}

export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}