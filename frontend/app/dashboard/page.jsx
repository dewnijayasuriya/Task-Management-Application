"use client";

import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import TaskBoard from "@/components/TaskBoard";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TaskBoard />
        </main>
      </div>
    </ProtectedRoute>
  );
}
