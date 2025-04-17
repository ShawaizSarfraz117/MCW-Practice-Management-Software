import Image from "next/image";

export default function VerifyRequest() {
  // Get email from URL search params
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams("");
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
        <div>
          <Image
            src="/email-sent.svg"
            alt="Email sent"
            width={100}
            height={100}
            className="mx-auto"
          />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Your link is on the way
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            A sign-in link has been sent to{" "}
            {email ? <strong>{email}</strong> : "your email address"}. The link
            will expire in 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
