"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button, Input, PasswordInput } from "@mcw/ui";

interface SignInBody {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<SignInBody>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: "/clients",
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      // Redirect to backoffice dashboard
      router.push("/clients");
      router.refresh(); // Refresh to update session data
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 bg-red-50 text-red-800 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="email"
        >
          Email
        </label>
        <Input
          required
          autoComplete="email"
          className="w-full"
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="password"
          >
            Password
          </label>
          <Link
            className="text-sm text-blue-600 hover:underline"
            href="/backoffice/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          required
          autoComplete="current-password"
          className="w-full"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
        />
      </div>

      <div>
        <Button className="w-full" disabled={isLoading} type="submit">
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
