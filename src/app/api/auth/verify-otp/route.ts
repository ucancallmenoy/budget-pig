import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { verifyOTP, isOTPExpired } from '@/lib/auth/otp';
import { OTPVerificationModel } from '@/lib/db/models/OTPVerification';
import { UserModel } from '@/lib/db/models/User';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = verifyOTPSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;

    await connectDB();

    // Find OTP verification record
    const otpRecord = await OTPVerificationModel.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP not found. Please register again.' },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      await OTPVerificationModel.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: 'OTP has expired. Please register again.' },
        { status: 400 }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      await OTPVerificationModel.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: 'Too many failed attempts. Please register again.' },
        { status: 429 }
      );
    }

    // Verify OTP
    const isValidOTP = await verifyOTP(otp, otpRecord.otp);

    if (!isValidOTP) {
      // Increment attempts
      otpRecord.attempts += 1;
      await otpRecord.save();

      return NextResponse.json(
        {
          error: 'Invalid OTP',
          attemptsRemaining: 5 - otpRecord.attempts,
        },
        { status: 400 }
      );
    }

    // Check if user already exists (safety check)
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      await OTPVerificationModel.deleteOne({ _id: otpRecord._id });
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Create user
    const user = await UserModel.create({
      email,
      password: otpRecord.password, // Already hashed
      name: otpRecord.name,
    });

    // Delete OTP record
    await OTPVerificationModel.deleteOne({ _id: otpRecord._id });

    return NextResponse.json(
      {
        message: 'Registration completed successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}