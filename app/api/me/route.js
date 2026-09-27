import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_SECRET, verifyToken, readUsers } from "@/lib/store";

export async function GET() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("session");
  const claims = verifyToken(sessionCookie?.value, SESSION_SECRET);

  if (!claims) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const user = readUsers().find((u) => u.id === claims.sub);
  if (!user) {
    return NextResponse.json({ message: "Session no longer valid." }, { status: 401 });
  }

  return NextResponse.json({ fullName: user.fullName, email: user.email, phone: user.phone });
}
