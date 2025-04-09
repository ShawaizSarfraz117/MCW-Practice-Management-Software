import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@mcw/ui/styles.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "McNulty Counseling",
  description: "McNulty Counseling Back Office",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  // Vars
  const direction = "ltr";

  return (
    <html dir={direction} id="__next" lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
