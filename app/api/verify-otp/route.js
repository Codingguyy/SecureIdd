import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  OTP_SECRET,
  SESSION_SECRET,
  TICKET_TTL,
  MAX_ATTEMPTS,
  signToken,
  verifyToken,
  verifyTotp,
  readUsers,
  writeUsers,
  findUserByEmail,
  hashCode,
  timingSafeEqualHex,
  generateOtp,
} from "@/lib/store";

export async function POST(request) {
  const { ticket, channel, code } = await request.json();
  const claims = verifyToken(ticket, OTP_SECRET);
  if (!claims || claims.purpose !== "register") {
    return NextResponse.json({ code: "expired", message: "Your session has expired. Please start again." }, { status: 400 });
  }
  if (!code || !["email", "mobile", "mfa"].includes(channel)) {
    return NextResponse.json({ message: "Enter the 6-digit code." }, { status: 400 });
  }

  let isCorrect = false;
  if (channel === "mfa" && claims.mfaMethod === "authenticator") {
    isCorrect = verifyTotp(claims.mfaSecret, code);
  } else {
    const hashField = channel === "email" ? "emailOtpHash" : channel === "mobile" ? "mobileOtpHash" : "mfaOtpHash";
    isCorrect = Boolean(claims[hashField]) && timingSafeEqualHex(hashCode(code), claims[hashField]);
  }

  if (!isCorrect) {
    const attempts = { ...claims.attempts, [channel]: (claims.attempts?.[channel] || 0) + 1 };
    const remaining = MAX_ATTEMPTS - attempts[channel];
    const nextClaims = { ...claims, attempts };
    delete nextClaims.exp;
    const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);

    if (remaining <= 0) {
      return NextResponse.json(
        { code: "max_attempts", message: "Maximum attempts reached. Please request a new code.", ticket: newTicket },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        code: "wrong_code",
        message: `Incorrect code. Please try again. You have ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
        ticket: newTicket,
      },
      { status: 400 }
    );
  }

  if (channel === "email") {
    const mobileOtp = generateOtp();
    const nextClaims = {
      ...claims,
      emailVerified: true,
      stage: "mobile",
      mobileOtpHash: hashCode(mobileOtp),
      attempts: { ...claims.attempts, mobile: 0 },
    };
    delete nextClaims.exp;
    const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
    return NextResponse.json({ stage: "mobile", ticket: newTicket, devOtp: mobileOtp });
  }

  if (channel === "mobile") {
    const nextClaims = { ...claims, mobileVerified: true, stage: "mfa-select" };
    delete nextClaims.exp;
    const newTicket = signToken(nextClaims, OTP_SECRET, TICKET_TTL);
    return NextResponse.json({ stage: "mfa-select", ticket: newTicket });
  }

  // channel === "mfa": finalize the account.
  if (findUserByEmail(claims.email)) {
    return NextResponse.json({ message: "An account with this email already exists." }, { status: 409 });
  }

  const user = {
    id: crypto.randomUUID(),
    fullName: claims.fullName,
    email: claims.email,
    phone: claims.phone,
    passwordHash: claims.passwordHash,
    mfaMethod: claims.mfaMethod,
    mfaSecret: claims.mfaMethod === "authenticator" ? claims.mfaSecret : undefined,
    createdAt: new Date().toISOString(),
  };
  const users = readUsers();
  users.push(user);
  writeUsers(users);

  const sessionToken = signToken({ sub: user.id, email: user.email }, SESSION_SECRET, 60 * 60 * 24 * 7);
  const response = NextResponse.json({ stage: "done", success: true, fullName: user.fullName });
  response.cookies.set("session", sessionToken, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return response;
}
