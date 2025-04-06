import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "./types";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Promise.resolve(cookieStore.getAll());
        },
        setAll(cookies) {
          cookies.forEach(c => cookieStore.set(c.name, c.value, c.options))
        }
      },
    }
  );
};
