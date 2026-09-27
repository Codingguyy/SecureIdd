import { NextResponse } from "next/server";
import { OTP_SECRET, TICKET_TTL, signToken, verifyToken, generateOtp, hashCode } from "@/lib/store";

export async function POST(request) {
  const { ticket, method } = await request.json();
  const claims = verifyToken(ticket, OTP_SECRET);
  if (!claims || claims.purpose !== "login") {
    return NextResponse.json({ message: "Your session has expired. Please log in again." }, { status: 400 });
  }
  if (!["email", "sms", "authenticator"].includes(method)) {
    return NextResponse.json({ message: "Choose a verification method." }, { status: 400 });
  }
  if (method === "authenticator" && !claims.hasAuthenticator) {
    return NextResponse.json({ message: "Authenticator app is not set up for this account." }, { status: 400 });
  }

  const nextClaims = { ...claims, method, stage: "verify", attempts: { otp: 0 } };
  delete nextClaims.exp;

  if (method === "authenticator") {
    const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
    return NextResponse.json({ ticket: newTicket, method });
  }

  const otp = generateOtp();
  nextClaims.otpHash = hashCode(otp);
  const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
  return NextResponse.json({ ticket: newTicket, method, devOtp: otp });
}
