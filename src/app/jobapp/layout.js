import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ProtectedAdminRoute from "@/app/components/additionals/protectedAdminRoute"


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"], 
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Job App",
  description: "This is a job application tracking app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ProtectedAdminRoute>
          {children}
        </ProtectedAdminRoute>
      </body>
    </html>
  );
}
