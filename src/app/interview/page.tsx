"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

function InterviewContent() {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");

  // Extract job description from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const rawJob = searchParams.get("job");

      if (!rawJob) {
        setError("No job description provided.");
        setLoading(false);
        return;
      }

      try {
        const decoded = decodeURIComponent(rawJob);
        setJobDescription(decoded);
      } catch (err) {
        setError("Failed to decode job description.");
        setLoading(false);
      }
    }
  }, []);

  // Fetch interview questions
  useEffect(() => {
    if (!jobDescription) return;

    async function fetchQuestions() {
      try {
        const res = await fetch("/.netlify/functions/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });

        const data = await res.json();

        if (!data.questions) throw new Error("No questions returned from Claude");

        const parsedQuestions = data.questions
          .split("\n")
          .filter((line: string) => line.trim())
          .map((text: string, index: number) => ({
            id: `q${index + 1}`,
            text: text.replace(/^\d+\.\s*/, "").trim(),
            type: "unknown",
            skill: "unspecified",
            difficulty: "medium",
          }));

        const jobTitleGuess = jobDescription.split("\n")[0]?.slice(0, 50) || "Job Role";

        const jobInfo = {
          jobTitle: jobTitleGuess,
          company: "Your Target Company",
          requiredSkills: [],
          responsibilities: [],
          qualifications: [],
          companyValues: [],
        };

        setQuestions(parsedQuestions);
        setJobData(jobInfo);
        setSessionId(`session_${Date.now()}`);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Failed to generate questions. Try again.");
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [jobDescription]);

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
              Analyzing the job description and generating questions...
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
          <div className="flex justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
            >
              Go Back
            </button>
          </div>
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
            Position: {jobData?.jobTitle} at {jobData?.company}
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
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
            <h1 className="text-2xl font-bold text-center text-white mb-6">
              Loading Interview
            </h1>
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
              <div className="bg-teal-500 h-2.5 rounded-full animate-pulse" style={{ width: "70%" }} />
            </div>
          </div>
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
