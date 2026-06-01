import { updateSession } from "@insforge/sdk/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { insforgeSessionOptions } from "@/lib/auth-config";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  await updateSession({
    requestCookies: {
      get: (name) => request.cookies.get(name),
    },
    responseCookies: response.cookies,
    ...insforgeSessionOptions,
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
