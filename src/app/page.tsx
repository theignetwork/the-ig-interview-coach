// 🔁 Home Page (page.tsx)
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/upload/FileUpload';

export default function Home() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextSelected = async (text: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      const res = await fetch("/.netlify/functions/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: text }),
      });

      const data = await res.json();

      if (!data.question) {
        throw new Error("Claude returned no question.");
      }

      // Save everything in localStorage
      localStorage.setItem("question", data.question);
      localStorage.setItem("jobTitle", data.jobTitle || "Custom Role");
      localStorage.setItem("company", data.company || "Company Name");

      router.push("/interview");
    } catch (err) {
      console.error("Error generating question:", err);
      setError("Something went wrong while generating interview questions.");
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
          <h2 className="text-2xl font-bold text-white mb-6">
            Paste Job Description
          </h2>

          <FileUpload onTextSelected={handleTextSelected} />

          {isProcessing && (
            <div className="mt-6">
              <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                <div
                  className="bg-teal-500 h-2.5 rounded-full animate-pulse"
                  style={{ width: "70%" }}
                ></div>
              </div>
              <p className="text-center text-slate-300">
                Analyzing job description and generating questions...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            How It Works
          </h2>

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
