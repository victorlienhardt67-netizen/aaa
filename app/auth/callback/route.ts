import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Point d'arrivée du lien de confirmation envoyé par email (inscription) —
// échange le code contre une session, puis redirige vers l'app.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/", request.url));
}
