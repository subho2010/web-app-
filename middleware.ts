import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  // We'll handle authentication in the client-side components
  // This is a simplified approach for the custom authentication system
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
