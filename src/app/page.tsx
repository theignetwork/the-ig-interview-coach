"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [jobText, setJobText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!jobText || jobText.trim().length < 10) {
      setError("Please enter a valid job description.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // Save to localStorage
      localStorage.setItem("pastedJobDescription", jobText);

      const documentId = `doc_${Date.now()}`;
      router.push(`/interview?documentId=${documentId}`);
    } catch (err) {
      console.error("Error handling submission:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            The IG Interview Coach
          </h1>
          <p className="text-xl text-slate-300">
            Practice your interview skills with AI-generated questions based on real job descriptions
          </p>
        </div>

        <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Paste Job Description</h2>

          <textarea
            rows={10}
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the job description here..."
            className="w-full p-4 rounded-md bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Submit"}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
          <ol className="space-y-4 list-decimal list-inside text-slate-300">
            <li>Paste a job description into the box</li>
            <li>Our AI analyzes it and generates relevant interview questions</li>
            <li>Answer the questions as you would in a real interview</li>
            <li>Receive follow-up questions based on your responses</li>
            <li>Get feedback and improvement suggestions</li>
          </ol>
        </div>
      </div>
    </main>
  );
}

