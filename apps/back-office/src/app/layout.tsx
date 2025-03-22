import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Back Office | Admin Portal',
  description: 'Admin/therapist application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="bg-indigo-700 text-white p-4">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">Admin Portal</h1>
          </div>
        </header>
        {children}
        <footer className="bg-gray-100 p-4 mt-auto">
          <div className="container mx-auto text-center">
            <p>&copy; {new Date().getFullYear()} My Project. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
} 