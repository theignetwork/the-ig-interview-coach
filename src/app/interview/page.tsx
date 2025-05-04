"use client";

import { Suspense, useEffect, useState } from "react";
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
    const question = localStorage.getItem("interviewQuestion");
    const jobTitle = localStorage.getItem("jobTitle") || "Unknown Role";
    const company = localStorage.getItem("company") || "Unknown Company";

    if (!question) {
      setError("Missing interview question.");
      setLoading(false);
      return;
    }

    const parsedQuestion = {
      id: "q1",
      text: question,
      type: "general",
      skill: "unspecified",
      difficulty: "medium",
    };

    const job = {
      jobTitle,
      company,
      requiredSkills: [],
      responsibilities: [],
      qualifications: [],
      companyValues: [],
    };

    setQuestions([parsedQuestion]);
    setJobData(job);
    setSessionId(`session_${Date.now()}`);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-white mb-6">
            Preparing Your Interview
          </h1>
          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
            <div className="bg-teal-500 h-2.5 rounded-full animate-pulse" style={{ width: "70%" }}></div>
          </div>
          <p className="text-center text-slate-300">
            Loading question and job details...
          </p>
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
    <Suspense fallback={
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
    }>
      <InterviewContent />
    </Suspense>
  );
}
