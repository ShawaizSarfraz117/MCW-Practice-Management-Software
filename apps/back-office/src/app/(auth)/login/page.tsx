import Link from "next/link";
import LoginForm from "./components/LoginForm";

export default function BackofficeSignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-800">
          MCW - Backoffice
        </h1>
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-semibold text-center mb-2">
          Admin Sign in
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Access your backoffice account
        </p>

        <LoginForm />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <Link className="text-blue-600 hover:underline" href="/help">
              Contact support
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Can't sign in?{" "}
          <Link className="text-blue-600 hover:underline" href="/help">
            Get Help
          </Link>
        </p>
        <p className="text-sm text-gray-500 mt-4">
          © 2023 MCW |{" "}
          <Link className="text-blue-600 hover:underline" href="/terms">
            Terms
          </Link>{" "}
          |{" "}
          <Link className="text-blue-600 hover:underline" href="/privacy">
            Privacy
          </Link>
        </p>
      </div>
    </div>
  );
}
