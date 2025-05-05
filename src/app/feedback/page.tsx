"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("sessionId");
      
      if (sid) {
        setSessionId(sid);
        loadInterviewData(sid);
      } else {
        setError("Missing session ID. Please try again.");
        setLoading(false);
      }
    }
  }, []);

  const loadInterviewData = async (sid: string) => {
    try {
      const savedData = localStorage.getItem(`interview_${sid}`);
      
      if (!savedData) {
        setError("Interview data not found. Please try again.");
        setLoading(false);
        return;
      }
      
      const interviewData = JSON.parse(savedData);
      await generateReport(interviewData);
    } catch (err) {
      console.error("Error loading interview data:", err);
      setError("Failed to load interview data. Please try again.");
      setLoading(false);
    }
  };

  const generateReport = async (interviewData: any) => {
    try {
      const response = await fetch("/.netlify/functions/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(interviewData)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const reportData = await response.json();
      setReport(reportData);
      setLoading(false);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate interview feedback. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Analyzing Your Interview</h1>
          <p className="text-slate-400">Please wait while we generate your personalized feedback...</p>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="w-full bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
            </div>
            <p className="text-center text-slate-400">
              Our AI coach is analyzing your responses and preparing detailed feedback...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
            <h1 className="text-2xl font-bold text-center text-red-400 mb-6">Error</h1>
            <p className="text-center text-slate-300 mb-6">{error}</p>
            <div className="flex justify-center">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Your Interview Feedback</h1>
        <p className="text-center text-slate-400 mb-4">Session ID: {sessionId}</p>
        
        <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700 mb-8">
          <div className="flex items-center mb-6">
            <div className="relative w-32 h-32 mr-6">
              <div className="w-full h-full rounded-full bg-slate-700"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-5xl font-bold text-teal-400">{report.overallScore}</span>
              </div>
              <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#1e293b" 
                  strokeWidth="10"
                />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#2dd4bf" 
                  strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 45 * report.overallScore / 100} ${2 * Math.PI * 45 * (1 - report.overallScore / 100)}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Overall Score</h2>
              <p className="text-slate-300">{report.overallFeedback}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-teal-400">Key Strengths</h2>
            <ul className="space-y-2">
              {report.keyStrengths.map((strength: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-teal-400 mr-2">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-teal-400">Areas for Improvement</h2>
            <ul className="space-y-2">
              {report.areasForImprovement.map((area: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-teal-400 mr-2">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {report.dangerZones && report.dangerZones.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 mb-8">
            <h2 className="text-xl font-bold mb-4 text-yellow-500">
              <span className="mr-2">⚠️</span>
              Danger Zone Alerts (Potential Red Flags)
            </h2>
            <p className="mb-4">Red Flag Risk: <span className="font-semibold">{report.dangerZoneRisk}</span></p>
            <ul className="space-y-2">
              {report.dangerZones.map((flag: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-red-500 mr-2">✕</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <h2 className="text-2xl font-bold mb-6">Question-by-Question Feedback</h2>
        
        {report.questionFeedback.map((qFeedback: any, i: number) => (
          <div key={i} className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-slate-700 rounded-lg w-16 h-16 flex items-center justify-center mr-4">
                <span className="text-2xl font-bold text-teal-400">{qFeedback.score}</span>
              </div>
              <h3 className="text-lg font-semibold">{qFeedback.question}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {qFeedback.strengths.map((strength: string, j: number) => (
                    <li key={j} className="flex items-start text-sm">
                      <span className="text-teal-400 mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Areas to Improve</h4>
                <ul className="space-y-1">
                  {qFeedback.improvements.map((improvement: string, j: number) => (
                    <li key={j} className="flex items-start text-sm">
                      <span className="text-teal-400 mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
              </div>
          </div>
        ))}
        
        <div className="text-center mt-12 mb-8">
          <p className="text-slate-400 mb-4">Powered by The IG Network</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
          >
            Try Another Interview
          </button>
        </div>
      </div>
    </div>
  );
}
