"use client";

import { useState } from "react";
import { useStudioAuth } from "../providers";
import Input from "../ui/input";
import Button from "../ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, isLoading } = useStudioAuth();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to sign in");
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-olive-900 mb-2">fitness</h1>
        <p className="text-olive-700 italic">studio management</p>
      </div>

      {registered && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          Registration successful! Please sign in with your new account.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm"
      >
        <h2 className="text-xl font-medium text-gray-900 mb-6">
          Sign in to your account
        </h2>

        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="studio@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {`Don't have an account?`}{" "}
            <Link href="/register" className="text-olive-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
