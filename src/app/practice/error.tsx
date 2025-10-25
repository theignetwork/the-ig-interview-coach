"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error to console for debugging
    console.error("Practice page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
        <h1 className="text-2xl font-bold text-center text-red-400 mb-6">
          Something Went Wrong
        </h1>
        <p className="text-center text-slate-300 mb-2">
          We couldn't load your practice session.
        </p>
        <p className="text-center text-slate-400 text-sm mb-6">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = 'https://igcareercoach.com/oracle-pro'}
            className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Back to Oracle PRO
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
