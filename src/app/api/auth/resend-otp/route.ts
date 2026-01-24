import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import { generateOTP, hashOTP, getOTPExpirationTime } from '@/lib/auth/otp';
import { sendOTPEmail } from '@/lib/email/mailer';
import { OTPVerificationModel } from '@/lib/db/models/OTPVerification';
import { z } from 'zod';

const resendOTPSchema = z.object({
  email: z.string().email('Invalid email'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = resendOTPSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    await connectDB();

    // Find existing OTP record
    const otpRecord = await OTPVerificationModel.findOne({ email });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'No pending registration found for this email' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const newOTP = generateOTP(6);
    const hashedOTP = await hashOTP(newOTP);

    // Update OTP record with new OTP and reset attempts
    otpRecord.otp = hashedOTP;
    otpRecord.expiresAt = getOTPExpirationTime();
    otpRecord.attempts = 0;
    await otpRecord.save();

    // Send new OTP email
    try {
      await sendOTPEmail({ email, otp: newOTP, name: otpRecord.name });
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'New OTP sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}