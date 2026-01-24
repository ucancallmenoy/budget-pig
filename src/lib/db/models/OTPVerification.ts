import mongoose, { Schema, Model } from 'mongoose';

export interface OTPVerification {
  _id: string;
  email: string;
  otp: string;
  name: string;
  password: string; // hashed
  expiresAt: Date;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OTPDocument extends Omit<OTPVerification, '_id'>, mongoose.Document {}

const OTPVerificationSchema = new Schema<OTPDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), 
      index: { expireAfterSeconds: 0 }, 
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

OTPVerificationSchema.index({ email: 1 });
OTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTPVerificationModel: Model<OTPDocument> =
  mongoose.models.OTPVerification ||
  mongoose.model<OTPDocument>('OTPVerification', OTPVerificationSchema);