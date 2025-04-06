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
          cookies.forEach((c) => {
            try {
              // In Server Components / Route Handlers, we should avoid
              // directly setting cookies as it may cause this error
              cookieStore.set(c.name, c.value, c.options);
            } catch (e) {
              console.error(e)
              // Silent catch - cookie operations in server components
              // may fail but shouldn't break the flow
            }
          });
        },
      },
    }
  );
};
