// ✅ 1. generate-questions.ts (Netlify Function)
import { Anthropic } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractTitleAndCompany(text: string) {
  const titleMatch = text.match(/(Role|Position):?\s*(.+)/i);
  const companyMatch = text.match(/(?:at|for)\s+([A-Z][a-zA-Z0-9& ]+)/);
  return {
    jobTitle: titleMatch ? titleMatch[2].trim() : "Custom Role",
    company: companyMatch ? companyMatch[1].trim() : "Company Name",
  };
}

export const handler = async (event: any) => {
  try {
    const { jobDescription } = JSON.parse(event.body || "{}");

    if (!jobDescription || jobDescription.trim().length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid job description" }),
      };
    }

    const prompt = `You are a friendly and sharp AI recruiter. Based on the job description below, ask ONE thoughtful interview question to evaluate the candidate's real-world fit. Keep the tone conversational, not robotic.\n\nJob Description:\n${jobDescription}\n\nQuestion:`;

    const completion = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const output = completion.content?.[0]?.text?.trim();

    if (!output) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Claude returned no output." }),
      };
    }

    const { jobTitle, company } = extractTitleAndCompany(jobDescription);

    return {
      statusCode: 200,
      body: JSON.stringify({
        questions: [output],
        jobTitle,
        company,
      }),
    };
  } catch (err: any) {
    console.error("Claude error:", err?.message || err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};


// ✅ 2. /app/interview/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

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

        if (!data.questions || !data.questions[0]) {
          throw new Error("Missing interview question.");
        }

        const parsedQuestions = data.questions.map((text: string, index: number) => ({
          id: `q${index + 1}`,
          text: text.trim(),
          type: "general",
          skill: "unspecified",
          difficulty: "medium",
        }));

        const jobInfo = {
          jobTitle: data.jobTitle || "Custom Role",
          company: data.company || "Company Name",
        };

        setQuestions(parsedQuestions);
        setJobData(jobInfo);
        setSessionId(`session_${Date.now()}`);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching questions:", err);
        setError("Missing interview question.");
        setLoading(false);
      }
    }

    fetchQuestions();
  }, [documentId, jobDescription]);

  if (loading) {
    return <p className="text-white text-center mt-20">Loading interview...</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-red-400 mb-6">Error</h1>
          <p className="text-center text-slate-300 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-teal-500 text-white rounded-md"
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
    <Suspense fallback={<p className="text-white">Loading...</p>}>
      <InterviewContent />
    </Suspense>
  );
}


// ✅ 3. /app/page.tsx (Home page)
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextSelected = async (text: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      localStorage.setItem("pastedJobDescription", text);

      const docId = `doc_${Date.now()}`;
      router.push(`/interview?documentId=${docId}`);
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white mb-4 text-center">
          The IG Interview Coach
        </h1>
        <p className="text-xl text-slate-300 text-center mb-8">
          Practice your interview skills with AI-generated questions based on real job descriptions
        </p>

        <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            Paste Job Description
          </h2>

          <textarea
            className="w-full h-48 p-4 rounded-md bg-slate-700 text-white"
            placeholder="Paste your job description here..."
            onChange={(e) => setTextInput(e.target.value)}
          ></textarea>

          <button
            onClick={() => handleTextSelected(textInput)}
            className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Submit Text
          </button>

          {isProcessing && (
            <p className="mt-4 text-slate-300 text-center">
              Processing...
            </p>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}




