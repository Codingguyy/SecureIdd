import { NextResponse } from "next/server";
import {
  OTP_SECRET,
  SESSION_SECRET,
  TICKET_TTL,
  MAX_ATTEMPTS,
  signToken,
  verifyToken,
  verifyTotp,
  readUsers,
  hashCode,
  timingSafeEqualHex,
} from "@/lib/store";

export async function POST(request) {
  const { ticket, code } = await request.json();
  const claims = verifyToken(ticket, OTP_SECRET);
  if (!claims || claims.purpose !== "login") {
    return NextResponse.json({ code: "expired", message: "Your session has expired. Please log in again." }, { status: 400 });
  }
  if (!code) return NextResponse.json({ message: "Enter the 6-digit code." }, { status: 400 });

  const user = readUsers().find((u) => u.id === claims.userId);
  if (!user) return NextResponse.json({ message: "Account no longer exists." }, { status: 401 });

  let isCorrect = false;
  if (claims.method === "authenticator") {
    isCorrect = verifyTotp(user.mfaSecret, code);
  } else {
    isCorrect = Boolean(claims.otpHash) && timingSafeEqualHex(hashCode(code), claims.otpHash);
  }

  if (!isCorrect) {
    const attempts = { otp: (claims.attempts?.otp || 0) + 1 };
    const remaining = MAX_ATTEMPTS - attempts.otp;
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

  const sessionToken = signToken({ sub: user.id, email: user.email }, SESSION_SECRET, 60 * 60 * 24 * 7);
  const response = NextResponse.json({ success: true, fullName: user.fullName });
  response.cookies.set("session", sessionToken, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return response;
}
