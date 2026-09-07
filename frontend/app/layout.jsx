import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "TaskBoard | Modern Task Management",
  description: "A Trello-like task management application built with Next.js and Express.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
