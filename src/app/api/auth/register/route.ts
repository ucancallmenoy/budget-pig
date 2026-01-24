import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongodb';
import { registerSchema } from '@/lib/validations/auth';
import { generateOTP, hashOTP, getOTPExpirationTime } from '@/lib/auth/otp';
import { sendOTPEmail } from '@/lib/email/mailer';
import { OTPVerificationModel } from '@/lib/db/models/OTPVerification';
import { UserModel } from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    await connectDB();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Check if there's a pending OTP verification
    const existingOTP = await OTPVerificationModel.findOne({ email });
    if (existingOTP) {
      await OTPVerificationModel.deleteOne({ _id: existingOTP._id });
    }

    // Generate OTP
    const otp = generateOTP(6);
    const hashedOTP = await hashOTP(otp);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store OTP verification record
    await OTPVerificationModel.create({
      email,
      otp: hashedOTP,
      name,
      password: hashedPassword,
      expiresAt: getOTPExpirationTime(),
      attempts: 0,
    });

    // Send OTP email
    try {
      await sendOTPEmail({ email, otp, name });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      // Delete the OTP record if email fails
      await OTPVerificationModel.deleteOne({ email });
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'OTP sent to your email. Please verify to complete registration.',
        email, // Send back email for frontend confirmation
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}