import { NextResponse } from "next/server";
import { OTP_SECRET, TICKET_TTL, signToken, verifyToken, generateOtp, hashCode } from "@/lib/store";

export async function POST(request) {
  const { ticket, channel } = await request.json();
  const claims = verifyToken(ticket, OTP_SECRET);
  if (!claims || claims.purpose !== "register") {
    return NextResponse.json({ message: "Your session has expired. Please start again." }, { status: 400 });
  }
  if (!["email", "mobile", "mfa"].includes(channel)) {
    return NextResponse.json({ message: "Unknown verification channel." }, { status: 400 });
  }

  const otp = generateOtp();
  const nextClaims = { ...claims, attempts: { ...claims.attempts, [channel]: 0 } };
  delete nextClaims.exp;

  if (channel === "email") nextClaims.emailOtpHash = hashCode(otp);
  if (channel === "mobile") nextClaims.mobileOtpHash = hashCode(otp);
  if (channel === "mfa") nextClaims.mfaOtpHash = hashCode(otp);

  const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
  return NextResponse.json({ ticket: newTicket, devOtp: otp });
}
