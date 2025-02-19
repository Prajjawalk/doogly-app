import React from "react";
import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

import { Providers } from "./providers";

const itim = Itim({
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Doogly App",
  description: "Doogly is a platform for creating and donating to hypercerts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={itim.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
