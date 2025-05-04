"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";

function InterviewContent() {
  const params = useSearchParams();
  const router = useRouter();

  const jobDescription = decodeURIComponent(params.get("job") || "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    if (jobDescription.length < 10) {
      setError("Job description missing.");
      setLoading(false);
      return;
    }

    fetch("/.netlify/functions/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.questions) throw new Error("No questions returned");
        setQuestions(data.questions);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to generate questions.");
      })
      .finally(() => setLoading(false));
  }, [jobDescription]);

  if (loading)
    return <p className="text-white text-center mt-20">Loading interview…</p>;

  if (error)
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

  const parsed = questions.map((q: string, i: number) => ({
    id: `q${i + 1}`,
    text: q,
  }));

  return (
    <InterviewSession
      questions={parsed}
      jobData={{ jobTitle: "Target Role" }}
      sessionId={`s_${Date.now()}`}
    />
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<p className="text-white">Loading…</p>}>
      <InterviewContent />
    </Suspense>
  );
}


