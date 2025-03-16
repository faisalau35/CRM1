"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showTwoFactorInput, setShowTwoFactorInput] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isBackupCode, setIsBackupCode] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    if (showTwoFactorInput) {
      try {
        // Verify 2FA code
        const response = await fetch("/api/auth/two-factor/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            token: twoFactorCode,
            isBackupCode,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error || "Invalid verification code");
          setIsLoading(false);
          return;
        }

        // If 2FA verification is successful, proceed with login
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Invalid credentials");
          setIsLoading(false);
          return;
        }

        router.refresh();
        router.push("/dashboard");
      } catch (error) {
        toast.error("Something went wrong");
        setIsLoading(false);
      }
    } else {
      try {
        // Check if user has 2FA enabled
        const response = await fetch(`/api/auth/two-factor/check?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.twoFactorEnabled) {
          // If 2FA is enabled, show the 2FA input
          setShowTwoFactorInput(true);
          setIsLoading(false);
          return;
        }

        // If 2FA is not enabled, proceed with normal login
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Invalid credentials");
          return;
        }

        router.refresh();
        router.push("/dashboard");
      } catch (error) {
        toast.error("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the CRM system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {!showTwoFactorInput ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">Two-Factor Authentication Code</Label>
                <Input
                  id="twoFactorCode"
                  name="twoFactorCode"
                  type="text"
                  placeholder="Enter your 6-digit code"
                  required
                  disabled={isLoading}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                />
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    id="isBackupCode"
                    checked={isBackupCode}
                    onChange={(e) => setIsBackupCode(e.currentTarget.checked)}
                    className="mr-2"
                  />
                  <Label htmlFor="isBackupCode" className="text-sm">
                    This is a backup code
                  </Label>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : showTwoFactorInput ? "Verify" : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 