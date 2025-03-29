"use client";

import { useState } from "react";
import { useStudioAuth } from "../providers";
import Input from "../ui/input";
import Button from "../ui/button";
import Link from "next/link";

const RegisterForm = () => {
  const [studioData, setStudioData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const { signUp, isLoading } = useStudioAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStudioData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (studioData.password !== studioData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (studioData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await signUp(studioData.email, studioData.password, {
        name: studioData.name,
        address: studioData.address,
        phone: studioData.phone,
      });
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to create account");
    }
  };

  return (
    <div className="max-w-lg w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-olive-900 mb-2">pilates</h1>
        <p className="text-olive-700 italic">studio management</p>
      </div>

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
          Create a new studio account
        </h2>

        <div className="space-y-4">
          <Input
            label="Studio Name"
            name="name"
            placeholder="Pure Pilates Studio"
            value={studioData.name}
            onChange={handleChange}
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="studio@example.com"
            value={studioData.email}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={studioData.password}
              onChange={handleChange}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={studioData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Studio Address"
            name="address"
            placeholder="123 Serenity Ave, Downtown"
            value={studioData.address}
            onChange={handleChange}
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={studioData.phone}
            onChange={handleChange}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-olive-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
