"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function RegisterPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [name, setName] = useState("");
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      push({ title: "Account created.", tone: "success" });
      router.replace("/");
    } catch (err) {
      push({ title: "Registration failed. Try again.", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="grid w-full grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <p className="text-xs uppercase text-muted">Start Securely</p>
        <h1 className="text-3xl font-semibold">Create your Retention workspace.</h1>
        <p className="text-sm text-muted">
          Sign up to manage customer segmentation models with complete tenant separation.
        </p>
        <div className="rounded-2xl border border-panelBorder bg-panel p-6">
          <p className="text-xs text-muted">What you get</p>
          <p className="mt-2 text-sm">
            Dedicated models, isolated data pipelines, and secure prediction APIs for each
            organization.
          </p>
        </div>
      </div>

      <Card className="w-full max-w-md">
        <CardTitle>Create account</CardTitle>
        <CardDescription>Join with a work email to continue.</CardDescription>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-4 text-xs text-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
