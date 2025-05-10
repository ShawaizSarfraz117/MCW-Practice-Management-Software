import { Inter } from "next/font/google";
import "./globals.css";
import "@mcw/ui/styles.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

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
