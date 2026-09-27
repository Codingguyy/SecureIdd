import { NextResponse } from "next/server";
import { OTP_SECRET, TICKET_TTL, signToken, verifyPassword, findUserByEmail } from "@/lib/store";

export async function POST(request) {
  const { identifier, password } = await request.json();
  if (!identifier || !password) {
    return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
  }

  const user = findUserByEmail(identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ message: "Invalid email or password. Please try again." }, { status: 401 });
  }

  const ticket = signToken(
    {
      purpose: "login",
      stage: "choose-method",
      userId: user.id,
      email: user.email,
      hasAuthenticator: user.mfaMethod === "authenticator" && Boolean(user.mfaSecret),
      attempts: { otp: 0 },
    },
    OTP_SECRET,
    TICKET_TTL
  );

  return NextResponse.json({ ticket, email: user.email });
}
