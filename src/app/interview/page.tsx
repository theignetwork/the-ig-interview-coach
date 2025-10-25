"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { fetchJSONWithRetry } from "@/lib/fetch-retry";
import { createInterviewSession, saveQuestions } from "@/lib/database/interview-service";

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

        // Use retry logic for more reliable API calls
        const data = await fetchJSONWithRetry(
          "/.netlify/functions/generate-questions",
          { jobDescription },
          {
            maxRetries: 3,
            onRetry: (attempt, error) => {
              console.log(`Retry attempt ${attempt}: ${error.message}`);
            }
          }
        );

        console.log("Received questions data:", data);

        if (!data.questions || !Array.isArray(data.questions) || data.questions.length < 3) {
          console.error("Invalid questions format:", data);
          throw new Error("Not enough questions returned from Claude.");
        }

        // Take the first 3 questions to ensure we have exactly what we need
        const parsedQuestions = data.questions.slice(0, 3);

        // Create database session
        const session = await createInterviewSession({
          job_description: jobDescription,
          job_title: "Custom Role",
          company: "Company Name"
        });

        console.log("Created database session:", session.id);

        // Save questions to database
        await saveQuestions(
          parsedQuestions.map((q: any, index: number) => ({
            session_id: session.id,
            text: q.text,
            type: q.type || 'behavioral',
            skill: q.skill || 'general',
            difficulty: q.difficulty || 'medium',
            order_index: index,
            is_follow_up: false
          }))
        );

        const fakeJobData = {
          jobTitle: session.job_data.title,
          company: session.job_data.company,
          requiredSkills: [],
          responsibilities: [],
          qualifications: [],
          companyValues: [],
        };

        setQuestions(parsedQuestions);
        setJobData(fakeJobData);
        setSessionId(session.id); // Use database session ID
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
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2.5 rounded-full animate-pulse shadow-lg shadow-teal-500/50"
                style={{ width: "70%" }}
              ></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>
                <p className="text-slate-300">Analyzing job description...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <p className="text-slate-400">Generating tailored questions...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                <p className="text-slate-500">Preparing interview session...</p>
              </div>
            </div>
            <p className="text-center text-teal-400 text-sm mt-4">
              ⚡ Estimated time: ~5-10 seconds
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





