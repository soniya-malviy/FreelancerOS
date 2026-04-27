import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import VisitTracker from "@/components/VisitTracker";

export const metadata: Metadata = {
  title: "FreelanceOS — AI Proposal Generator for Freelancers",
  description:
    "Generate winning freelance proposals in 30 seconds. Paste a job description, set your rate, and let AI write a personalized proposal ready to send on Upwork, Fiverr, or LinkedIn.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('fo_theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <VisitTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
