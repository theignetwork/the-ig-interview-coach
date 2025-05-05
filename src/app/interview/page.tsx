"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

// Client component that safely uses window
function InterviewContent() {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const docId = searchParams.get("documentId");
      const pastedJob = localStorage.getItem("pastedJobDescription");

      if (docId && pastedJob) {
        setDocumentId(docId);
        setJobDescription(pastedJob);
      } else {
        setError("Missing job description or document ID.");
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!documentId || !jobDescription) return;

    async function fetchQuestions() {
      try {
        if (!loading) setLoading(true);

        const res = await fetch("/.netlify/functions/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });

        const data = await res.json();

        if (!data.questions || data.questions.length < 3) {
          throw new Error("Not enough questions returned from Claude.");
        }

        const parsedQuestions = data.questions;

        const fakeJobData = {
          jobTitle: "Custom Role",
          company: "Company Name",
          requiredSkills: [],
          responsibilities: [],
          qualifications: [],
          companyValues: [],
        };

        setQuestions(parsedQuestions);
        setJobData(fakeJobData);
        setSessionId(`session_${Date.now()}`);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to generate interview questions. Please try again.");
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [documentId, jobDescription]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-white mb-6">
            Preparing Your Interview
          </h1>
          <div className="space-y-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
              <div
                className="bg-teal-500 h-2.5 rounded-full animate-pulse"
                style={{ width: "70%" }}
              ></div>
            </div>
            <p className="text-center text-slate-300">
              Analyzing job description and generating a tailored interview...
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
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
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
            Position: {jobData?.jobTitle || "Software Engineer"} at{" "}
            {jobData?.company || "Company"}
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

// Main page component with Suspense wrapper
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
              <div
                className="bg-teal-500 h-2.5 rounded-full animate-pulse"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}





