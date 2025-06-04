import { Inter } from "next/font/google";

import { Providers } from "./providers";

import "./globals.css";
import "@mcw/ui/styles.css";

const inter = Inter({ subsets: ["latin"] });

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html dir="ltr" id="__next" lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
