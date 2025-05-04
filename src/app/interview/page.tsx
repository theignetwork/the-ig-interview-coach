"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

function InterviewContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useState<string>("Custom Role");
  const [company, setCompany] = useState<string>("Company Name");
  const [sessionId, setSessionId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const pastedJob = localStorage.getItem("pastedJobDescription");
      setJobDescription(pastedJob);
    }
  }, []);

  useEffect(() => {
    if (!jobDescription) {
      setError("Missing job description.");
      setLoading(false);
      return;
    }

    async function fetchQuestion() {
      try {
        setLoading(true);
        const res = await fetch("/.netlify/functions/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });

        const data = await res.json();

        if (!data.question) throw new Error("Missing interview question.");

        setQuestion(data.question);
        setJobTitle(data.jobTitle || "Custom Role");
        setCompany(data.company || "Company Name");
        setSessionId(`session_${Date.now()}`);
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to generate interview question. Please try again.");
        setLoading(false);
      }
    }

    fetchQuestion();
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
              <div
                className="bg-teal-500 h-2.5 rounded-full animate-pulse"
                style={{ width: "70%" }}
              ></div>
            </div>
            <p className="text-center text-slate-300">
              Analyzing job description and generating a thoughtful interview question...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-red-400 mb-6">Error</h1>
          <p className="text-center text-slate-300 mb-6">{error || "Missing interview question."}</p>
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

  const parsedQuestion = {
    id: "q1",
    text: question,
    type: "general",
    skill: "unspecified",
    difficulty: "medium",
  };

  const jobData = {
    jobTitle,
    company,
    requiredSkills: [],
    responsibilities: [],
    qualifications: [],
    companyValues: [],
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">The IG Interview Coach</h1>
          <p className="text-slate-300 mt-2">
            Position: {jobTitle} at {company}
          </p>
        </header>

        <InterviewSession
          questions={[parsedQuestion]}
          jobData={jobData}
          sessionId={sessionId}
        />
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

