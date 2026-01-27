"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      push({ title: "Welcome back.", tone: "success" });
      router.replace("/");
    } catch (err) {
      push({ title: "Login failed. Check credentials.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <p className="text-xs uppercase text-muted">Enterprise Access</p>
        <h1 className="text-3xl font-semibold">Welcome back to Retention Intelligence.</h1>
        <p className="text-sm text-muted">
          Securely access your workspace to train, monitor, and deploy customer segmentation models.
        </p>
        <div className="rounded-2xl border border-panelBorder bg-panel p-6">
          <p className="text-xs text-muted">Security note</p>
          <p className="mt-2 text-sm">
            Your models, data, and predictions are isolated per tenant. Access is controlled via
            Firebase Auth.
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your company email to continue.</CardDescription>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted">
          New here?{" "}
          <Link href="/register" className="text-accent">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
