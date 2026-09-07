"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/context/AuthContext";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-sm font-medium mb-6">
            Simple. Fast. Organized.
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-6">
            TaskBoard
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
            A clean, Trello-inspired task management app. Create tasks, assign
            them to your team, and track progress across To Do, Doing, and Done
            — all in one modern board.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg text-white bg-brand-600 hover:bg-brand-700 font-medium transition-colors shadow-sm"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-lg text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 font-medium transition-colors"
            >
              Register
            </Link>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 grid sm:grid-cols-3 gap-6">
          {[
            {
              title: "Drag & Drop Board",
              desc: "Move tasks between To Do, Doing, and Done with an intuitive drag-and-drop interface.",
            },
            {
              title: "Role-Based Access",
              desc: "Normal users manage their own tasks, while administrators assign and oversee everything.",
            },
            {
              title: "Secure by Design",
              desc: "JWT authentication and backend-enforced permissions keep your data safe.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <h3 className="font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Built with Next.js, Express, and MongoDB.
      </footer>
    </div>
  );
}
