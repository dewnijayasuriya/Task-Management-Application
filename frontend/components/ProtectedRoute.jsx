"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Spinner from "@/components/Spinner";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth(); //Gets the current user and loading status from AuthContext.
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // It waits until AuthContext finishes checking the user's authentication.

    if (!user) {
      router.replace("/login");
      return;
    }

    if (adminOnly && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, loading, adminOnly, router]);

  if (loading || !user || (adminOnly && user.role !== "ADMIN")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return children;
}
