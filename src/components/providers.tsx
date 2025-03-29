"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Session, User } from "@supabase/supabase-js";
import { Studio } from "@/types/studio.types";

type StudioAuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    studioData: Partial<Studio>
  ) => Promise<void>;
  signOut: () => Promise<void>;
};

const StudioAuthContext = createContext<StudioAuthContextType | undefined>(
  undefined
);

export const StudioAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);

      if (event === "SIGNED_IN") {
        router.refresh();
      }
      if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase.auth]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    studioData: Partial<Studio>
  ) => {
    setIsLoading(true);
    try {
      // Register the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            studio_name: studioData.name,
          },
        },
      });
      if (authError) throw authError;

      // Create the studio profile if sign up successful
      if (authData.user) {
        const { error: profileError } = await supabase.from("studios").insert({
          id: authData.user.id,
          name: studioData.name,
          address: studioData.address || "",
          phone: studioData.phone || "",
          email: email,
          description: studioData.description || "",
          opening_hours: studioData.opening_hours || "",
        });
        if (profileError) throw profileError;
      }

      router.push("/login?registered=true");
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <StudioAuthContext.Provider value={value}>
      {children}
    </StudioAuthContext.Provider>
  );
};

export const useStudioAuth = () => {
  const context = useContext(StudioAuthContext);
  if (context === undefined) {
    throw new Error("useStudioAuth must be used within a StudioAuthProvider");
  }
  return context;
};

// Root providers setup (tanstack/react-query + auth)
export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <StudioAuthProvider>{children}</StudioAuthProvider>
    </QueryClientProvider>
  );
}
