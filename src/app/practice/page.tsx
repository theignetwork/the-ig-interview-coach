"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { supabase } from "@/lib/supabase";

interface OraclePrepSession {
  id: string;
  member_email: string;
  job_description: string;
  job_title: string;
  company_name: string;
  role: string;
  experience_level: string;
  questions: any[];
  status: string;
  metadata: any;
  created_at: string;
}

// Client component that safely uses window and searchParams
function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [prepSessionId, setPrepSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [oracleSessionId, setOracleSessionId] = useState<string | null>(null);

  // Get prep_session ID from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prepId = searchParams.get("prep_session");
      if (prepId) {
        setPrepSessionId(prepId);
      } else {
        setError("Missing prep session ID. Please start from Oracle PRO.");
        setLoading(false);
      }
    }
  }, [searchParams]);

  // Fetch prep session from Supabase
  useEffect(() => {
    if (!prepSessionId) return;

    // Reset state when prep session ID changes
    setQuestions([]);
    setJobData(null);
    setLoading(true);
    setError(null);

    async function fetchPrepSession() {
      try {
        console.log('🔍 Fetching Oracle PRO prep session:', prepSessionId);

        // Fetch prep session from Supabase
        const { data: prepSession, error: fetchError } = await supabase
          .from('oracle_prep_sessions')
          .select('*')
          .eq('id', prepSessionId)
          .single();

        if (fetchError) {
          console.error('Supabase fetch error:', fetchError);
          throw new Error('Could not find prep session');
        }

        if (!prepSession) {
          throw new Error('Prep session not found');
        }

        console.log('✅ Prep session loaded:', prepSession);

        // Extract questions from prep session
        const oracleQuestions = prepSession.questions || [];

        if (oracleQuestions.length === 0) {
          throw new Error('No questions found in prep session');
        }

        // Format questions for Interview Coach
        const formattedQuestions = oracleQuestions.map((q: any, index: number) => ({
          id: `oracle_${index}`,
          text: q.text || q,
          category: q.category || 'General',
          difficulty: q.difficulty || 'Medium',
          soar_answer: q.soar_answer || null
        }));

        // Build job data object
        const jobDataObj = {
          jobTitle: prepSession.job_title || prepSession.role || 'Position',
          company: prepSession.company_name || 'Company',
          requiredSkills: [],
          responsibilities: [],
          qualifications: [],
          companyValues: [],
          fromOracle: true, // Flag to show Oracle PRO badge
          oracleSessionId: prepSession.metadata?.oracle_session_id || null
        };

        setQuestions(formattedQuestions);
        setJobData(jobDataObj);
        setSessionId(`oracle_practice_${Date.now()}`);
        setOracleSessionId(prepSession.metadata?.oracle_session_id || null);

        // Clear any previous session data and set flag for Oracle PRO
        sessionStorage.clear();
        sessionStorage.setItem('oracle_pro_session', 'true');
        sessionStorage.setItem('prep_session_id', prepSessionId);

        setLoading(false);

        console.log('✅ Interview ready with', formattedQuestions.length, 'questions');

      } catch (error: any) {
        console.error('Error loading prep session:', error);
        setError(error.message || 'Failed to load prep session');
        setLoading(false);
      }
    }

    fetchPrepSession();
  }, [prepSessionId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <div className="flex items-center justify-center mb-6">
            <div className="oracle-pro-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">ORACLE PRO</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-6">
            Loading Your Prep Session
          </h1>
          <div className="space-y-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
              <div
                className="bg-gradient-to-r from-teal-500 to-blue-500 h-2.5 rounded-full oracle-progress-bar"
              ></div>
            </div>
            <p className="text-center text-slate-300">
              Retrieving your questions from Oracle PRO...
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
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.href = 'https://interview-oracle-pro.netlify.app'}
              className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Back to Oracle PRO
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Start New Interview
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
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">The IG Interview Coach</h1>
            <div className="oracle-pro-badge">
              <span className="badge-icon">⚡</span>
              <span className="badge-text">ORACLE PRO</span>
            </div>
          </div>
          <p className="text-slate-300 mt-2">
            Position: {jobData?.jobTitle || "Software Engineer"} at{" "}
            {jobData?.company || "Company"}
          </p>
          <p className="text-teal-400 text-sm mt-1">
            🎯 Practicing with questions from Interview Oracle PRO
          </p>
        </header>

        {questions.length > 0 && jobData && (
          <InterviewSession
            key={prepSessionId} // Force remount when prep session changes
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
export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
            <h1 className="text-2xl font-bold text-center text-white mb-6">
              Loading Practice Session
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
      <PracticeContent />
    </Suspense>
  );
}
