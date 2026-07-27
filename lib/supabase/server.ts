// Client Supabase côté serveur (Server Components, Route Handlers) — lit/écrit
// la session via les cookies de la requête Next.js.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Appelé depuis un Server Component (pas une Route Handler/Action) —
            // sans effet ici, le middleware se charge de rafraîchir la session.
          }
        },
      },
    }
  );
}
