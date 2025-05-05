import { Inter } from "next/font/google";
import "./globals.css";
import "@mcw/ui/styles.css";
import { Providers } from "./providers";
import { Sidebar } from "@mcw/ui";
import Topbar from "@/components/layouts/Topbar";

const inter = Inter({ subsets: ["latin"] });

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  // Vars
  const direction = "ltr";

  return (
    <html dir={direction} id="__next" lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Topbar />
          <div className="flex h-screen border-collapse overflow-hidden">
            <Sidebar className="hidden md:block" />
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-secondary/10 pb-1 pt-4 md:pt-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
