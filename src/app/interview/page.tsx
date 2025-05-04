"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

function InterviewContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const encodedQuestion = searchParams.get("questions");

      if (!encodedQuestion) {
        setError("Missing interview question.");
        setLoading(false);
        return;
      }

      try {
        const decodedQuestion = decodeURIComponent(encodedQuestion);

        // This was already returned from the API in the homepage
        const res = await fetch("/.netlify/functions/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription: decodedQuestion }),
        });

        const data = await res.json();

        if (!data.question) throw new Error("No question returned.");

        const parsedQuestions = [
          {
            id: "q1",
            text: data.question,
            type: "unknown",
            skill: "unspecified",
            difficulty: "medium",
          },
        ];

        const meta = {
          jobTitle: data.jobTitle || "Custom Role",
          company: data.company || "Company Name",
        };

        setQuestions(parsedQuestions);
        setJobData(meta);
        setSessionId(`session_${Date.now()}`);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load interview:", err);
        setError("Something went wrong while preparing your interview.");
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-white mb-6">
            Preparing Your Interview
          </h1>
          <div className="space-y-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
              <div className="bg-teal-500 h-2.5 rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
            <p className="text-center text-slate-300">
              Generating your first question...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-red-400 mb-6">Error</h1>
          <p className="text-center text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">The IG Interview Coach</h1>
          <p className="text-slate-300 mt-2">
            Position: {jobData.jobTitle} at {jobData.company}
          </p>
        </header>

        {questions.length > 0 && jobData && (
          <InterviewSession
            questions={questions}
            jobData={jobData}
            sessionId={sessionId}
          />
        )}
      </div>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InterviewContent />
    </Suspense>
  );
}


