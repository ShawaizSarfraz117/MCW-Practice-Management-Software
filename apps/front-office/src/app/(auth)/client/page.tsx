"use client";

import { Button } from "@mcw/ui";
import Image from "next/image";
import Link from "next/link";
import newMeeting from "@/assets/images/newMeeting.png";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <header className="py-4 px-6 text-center">
        <p className="text-sm">
          Existing Client?{" "}
          <Link
            href="/login"
            className="text-primary-600 text-green-700 hover:text-primary-700 font-medium"
          >
            Sign In
          </Link>
        </p>
      </header>

      {/* Main Content */}
      <main className="custom-bg-new-client px-4 pt-16 pb-24 text-center">
        <h1 className="text-4xl md:text-5xl font-serif mb-6 text-gray-900">
          Alam Naqvi
        </h1>

        <Link
          href="mailto:contact@example.com"
          className="inline-flex items-center text-[#b36800] text-underline text-primary-600 hover:text-primary-700 mb-12"
        >
          <span className="mr-2">✉</span>
          Contact
        </Link>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Button
            size="lg"
            variant="default"
            className="bg-green-700 rounded-none hover:bg-green-800 text-white uppercase"
            onClick={() => router.push("/request")}
          >
            I&apos;m a new client
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="bg-[#4A4F54] rounded-none hover:bg-[#4A4F54]/90 text-white uppercase"
            onClick={() => router.push("/login")}
          >
            I&apos;m an existing client
          </Button>
        </div>

        {/* Video Office Illustration */}
        <div className="max-w-lg mx-auto shadow-lg">
          <Image
            src={newMeeting}
            alt="Video Office"
            width={500}
            height={500}
            className="w-full"
          />
          <p className="text-gray-600 mt-4 text-left p-4 font-bold">
            Video Office
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
