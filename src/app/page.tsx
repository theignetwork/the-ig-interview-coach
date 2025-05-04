"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [jobText, setJobText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (jobText.trim().length < 10) {
      setError("Please paste a longer job description.");
      return;
    }
    setError(null);
    setBusy(true);
    // put the JD directly in the URL (safer than localStorage)
    router.push(
      "/interview?job=" + encodeURIComponent(jobText.trim())
    );
  };

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white text-center mb-6">
          The IG Interview Coach
        </h1>

        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            Paste Job Description
          </h2>

          <textarea
            rows={10}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            className="w-full p-4 rounded-md bg-slate-700 text-white"
            placeholder="Paste job description here…"
          />

          <button
            onClick={submit}
            disabled={busy}
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md disabled:opacity-50"
          >
            {busy ? "Processing…" : "Start Interview"}
          </button>

          {error && (
            <p className="mt-4 text-red-300 bg-red-900/40 p-3 rounded">{error}</p>
          )}
        </div>
      </div>
    </main>
  );
}


