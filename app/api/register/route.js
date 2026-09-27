import { NextResponse } from "next/server";
import { OTP_SECRET, TICKET_TTL, signToken, hashPassword, findUserByEmail, generateOtp, hashCode } from "@/lib/store";

export async function POST(request) {
  const { fullName, email, phone, password } = await request.json();

  if (!fullName || fullName.trim().length < 2) {
    return NextResponse.json({ message: "Enter your full name." }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
  }
  if (!phone || !/^[\d\s-]{7,15}$/.test(phone)) {
    return NextResponse.json({ message: "Enter a valid mobile number." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
  }

  const otp = generateOtp();
  const ticket = signToken(
    {
      purpose: "register",
      stage: "email",
      fullName: fullName.trim(),
      email,
      phone: phone.trim(),
      passwordHash: hashPassword(password),
      emailOtpHash: hashCode(otp),
      emailVerified: false,
      mobileVerified: false,
      attempts: { email: 0, mobile: 0, mfa: 0 },
    },
    OTP_SECRET,
    TICKET_TTL
  );

  // DEMO ONLY — see README. A real build emails/texts this instead.
  return NextResponse.json({ ticket, devOtp: otp });
}
