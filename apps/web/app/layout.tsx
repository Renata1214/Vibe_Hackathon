"use client";

import { SessionProvider } from "next-auth/react";
import { Manrope } from "next/font/google";
import * as Frigade from '@frigade/react';
import "./globals.css";

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-manrope">
        <SessionProvider>
          <Frigade.Tour flowId="flow_vXuh2M6e" />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
