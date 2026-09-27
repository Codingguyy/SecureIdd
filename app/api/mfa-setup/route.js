import { NextResponse } from "next/server";
import { OTP_SECRET, TICKET_TTL, signToken, verifyToken, generateTotpSecret, buildOtpauthUri, generateOtp, hashCode } from "@/lib/store";

export async function POST(request) {
  const { ticket, method } = await request.json();
  const claims = verifyToken(ticket, OTP_SECRET);
  if (!claims || claims.purpose !== "register" || !claims.mobileVerified) {
    return NextResponse.json({ message: "Your session has expired. Please start again." }, { status: 400 });
  }
  if (!["authenticator", "sms", "email"].includes(method)) {
    return NextResponse.json({ message: "Choose an MFA method." }, { status: 400 });
  }

  if (method === "authenticator") {
    const secret = generateTotpSecret();
    const nextClaims = {
      ...claims,
      mfaMethod: "authenticator",
      mfaSecret: secret,
      stage: "mfa-verify",
      attempts: { ...claims.attempts, mfa: 0 },
    };
    delete nextClaims.exp;
    const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
    return NextResponse.json({ ticket: newTicket, method, secret, otpauthUri: buildOtpauthUri(secret, claims.email) });
  }

  const otp = generateOtp();
  const nextClaims = {
    ...claims,
    mfaMethod: method,
    mfaOtpHash: hashCode(otp),
    stage: "mfa-verify",
    attempts: { ...claims.attempts, mfa: 0 },
  };
  delete nextClaims.exp;
  const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
  return NextResponse.json({ ticket: newTicket, method, devOtp: otp });
}
