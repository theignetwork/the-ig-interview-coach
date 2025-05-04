// /app/interview/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

interface JobData {
  jobTitle: string;
  company: string;
  requiredSkills: string[];
  responsibilities: string[];
  qualifications: string[];
  companyValues: string[];
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<p className="text-white text-center mt-20">Loading…</p>}>
      <InterviewContent />
    </Suspense>
  );
}

function InterviewContent() {
  const params = useSearchParams();
  const router = useRouter();

  // grab the "job" param and decode it
  const raw = params.get("job") || "";
  const jobDescription = decodeURIComponent(raw);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [jobData, setJobData] = useState<JobData>({
    jobTitle: "Custom Role",
    company: "Company Name",
    requiredSkills: [],
    responsibilities: [],
    qualifications: [],
    companyValues: [],
  });
  const [sessionId] = useState(() => `session_${Date.now()}`);

  useEffect(() => {
    if (jobDescription.length < 10) {
      setError("Please paste a valid job description.");
      setLoading(false);
      return;
    }

    fetch("/.netlify/functions/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("No questions returned");
        }
        // populate state
        setQuestions(data.questions);
        setJobData({
          jobTitle: data.jobTitle || "Custom Role",
          company: data.company || "Company Name",
          requiredSkills: [],
          responsibilities: [],
          qualifications: [],
          companyValues: [],
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to generate interview questions. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [jobDescription]);

  if (loading) {
    return <p className="text-white text-center mt-20">Loading interview…</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center mt-20">
        <p className="text-red-300 mb-4">{error}</p>
        <button
          className="px-4 py-2 bg-teal-500 text-white rounded"
          onClick={() => router.push("/")}
        >
          Back
        </button>
      </div>
    );
  }

  // map each string into the shape InterviewSession expects
  const parsed = questions.map((text, i) => ({
    id: `q${i + 1}`,
    text: text.trim(),
    type: "general",
    skill: "unspecified",
    difficulty: "medium",
  }));

  return (
    <InterviewSession
      questions={parsed}
      jobData={jobData}
      sessionId={sessionId}
    />
  );
}



