"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchJSONWithRetry } from "@/lib/fetch-retry";

export default function FeedbackPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [isLocalStorageAvailable, setIsLocalStorageAvailable] = useState(true);

  // Check localStorage availability
  useEffect(() => {
    try {
      const testKey = "__test_storage__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      setIsLocalStorageAvailable(true);
    } catch (e) {
      console.error("localStorage is not available:", e);
      setIsLocalStorageAvailable(false);
      setError("Your browser doesn't support local storage or it's disabled (this happens in incognito mode). Please use a regular browser window or enable localStorage to view your interview feedback.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLocalStorageAvailable) return;
    
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
  }, [isLocalStorageAvailable]);

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
      const reportData = await fetchJSONWithRetry(
        "/.netlify/functions/generate-report",
        interviewData,
        {
          maxRetries: 3,
          initialDelay: 1500, // Longer delay for report generation
          onRetry: (attempt) => {
            console.log(`Generating report... retry attempt ${attempt}`);
          }
        }
      );

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
            <div className="flex justify-center items-center py-8 mb-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-cyan-500/30 animate-ping"></div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></div>
                <p className="text-slate-300">Analyzing your answers...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <p className="text-slate-400">Identifying strengths and areas for improvement...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-teal-600 rounded-full animate-pulse delay-75"></div>
                <p className="text-slate-400">Generating personalized recommendations...</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                <p className="text-slate-500">Preparing your detailed report...</p>
              </div>
            </div>

            <p className="text-center text-teal-400 text-sm">
              ⚡ Your feedback will be ready in ~5-10 seconds
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
        
        {/* Enhanced premium score circle component */}
        <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700 mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative w-40 h-40 md:mr-8 mb-6 md:mb-0">
              {/* Outer glow effect */}
              <div className="absolute inset-0 rounded-full bg-teal-400/10 blur-xl"></div>
              
              {/* Background gradient circle */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner"></div>
              
              {/* Score display with animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className={`
                    text-6xl font-bold drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]
                    ${report.overallScore >= 80 ? 'text-teal-400' : 
                      report.overallScore >= 70 ? 'text-teal-300' : 
                      report.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'}
                  `}>{report.overallScore}</span>
                </div>
              </div>
              
              {/* Progress circle with gradient and animation */}
              <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d9488" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                  {/* Add blur filter for glow effect */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Dark track circle */}
                <circle 
                  cx="50" cy="50" r="42" 
                  fill="none" 
                  stroke="#1e293b" 
                  strokeWidth="8"
                />
                
                {/* Secondary indicator track */}
                <circle 
                  cx="50" cy="50" r="42" 
                  fill="none" 
                  stroke="#0f172a" 
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
                
                {/* Score progress circle with glow */}
                <circle 
                  cx="50" cy="50" r="42" 
                  fill="none" 
                  stroke="url(#scoreGradient)" 
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 42 * report.overallScore / 100} ${2 * Math.PI * 42 * (1 - report.overallScore / 100)}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  filter="url(#glow)"
                />
                
                {/* Decorative dots at 25%, 50%, 75% intervals */}
                <circle cx="50" cy="8" r="2" fill="#64748b" />
                <circle cx="92" cy="50" r="2" fill="#64748b" />
                <circle cx="50" cy="92" r="2" fill="#64748b" />
                <circle cx="8" cy="50" r="2" fill="#64748b" />
              </svg>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 text-white">Overall Score</h2>
              <div className="bg-slate-900/50 p-4 rounded border-l-4 border-teal-500">
                <p className="text-slate-300 leading-relaxed">{report.overallFeedback}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Strengths and Areas for Improvement - Enhanced with icons and better visual hierarchy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 transition-all hover:shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-teal-400 flex items-center">
              <span className="mr-2">✓</span>Key Strengths
            </h2>
            <ul className="space-y-3">
              {report.keyStrengths.map((strength: string, i: number) => (
                <li key={i} className="flex items-start pl-2 border-l-2 border-teal-400">
                  <span className="text-teal-400 mr-2">•</span>
                  <span className="text-lg">{strength}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 transition-all hover:shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-teal-400 flex items-center">
              <span className="mr-2">🎯</span>Areas for Improvement
            </h2>
            <ul className="space-y-3">
              {report.areasForImprovement.map((area: string, i: number) => (
                <li key={i} className="flex items-start pl-2 border-l-2 border-yellow-500">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span className="text-lg">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Danger Zone - Enhanced with more prominent visual treatment */}
        {report.dangerZones && report.dangerZones.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-red-900 mb-8 transition-all hover:shadow-lg">
            <div className="bg-red-900/20 -m-2 p-2 rounded-t-lg">
              <h2 className="text-xl font-bold mb-2 text-yellow-500 flex items-center">
                <span className="mr-2">⚠️</span>
                Danger Zone Alerts (Potential Red Flags)
              </h2>
              <p className="mb-4">Red Flag Risk: 
                <span className={`font-semibold ml-2 ${
                  report.dangerZoneRisk === "High" ? "text-red-500" :
                  report.dangerZoneRisk === "Medium" ? "text-yellow-500" :
                  "text-teal-500"
                }`}>{report.dangerZoneRisk}</span>
              </p>
            </div>
            <ul className="space-y-2 mt-4">
              {report.dangerZones.map((flag: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="text-red-500 mr-2">✕</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Question-by-Question Feedback - Enhanced with better scoring visuals */}
        <h2 className="text-2xl font-bold mb-6 border-b border-slate-700 pb-2">Question-by-Question Feedback</h2>
        
        {report.questionFeedback.map((qFeedback: any, i: number) => (
          <div key={i} className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 mb-6 transition-all hover:shadow-lg">
            <div className="flex items-center mb-4">
              <div className={`
                rounded-lg w-16 h-16 flex items-center justify-center mr-4
                ${qFeedback.score >= 80 ? 'bg-teal-900/50' : 
                  qFeedback.score >= 70 ? 'bg-teal-800/30' : 
                  qFeedback.score >= 60 ? 'bg-yellow-900/30' : 'bg-red-900/30'}
              `}>
                <span className={`
                  text-2xl font-bold
                  ${qFeedback.score >= 80 ? 'text-teal-400' : 
                    qFeedback.score >= 70 ? 'text-teal-300' : 
                    qFeedback.score >= 60 ? 'text-yellow-400' : 'text-red-400'}
                `}>{qFeedback.score}</span>
              </div>
              <h3 className="text-lg font-semibold">{qFeedback.question}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center text-teal-400">
                  <span className="mr-2">✓</span>Strengths
                </h4>
                <ul className="space-y-2">
                  {qFeedback.strengths.map((strength: string, j: number) => (
                    <li key={j} className="flex items-start text-sm">
                      <span className="text-teal-400 mr-2">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center text-yellow-500">
                  <span className="mr-2">🎯</span>Areas to Improve
                </h4>
                <ul className="space-y-2">
                  {qFeedback.improvements.map((improvement: string, j: number) => (
                    <li key={j} className="flex items-start text-sm">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
        
        {/* Practice Questions Section - New component */}
        {report.practiceQuestions && report.practiceQuestions.length > 0 && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 mb-8">
            <h2 className="text-xl font-bold mb-4 text-teal-400 flex items-center">
              <span className="mr-2">📝</span>Practice These Questions
            </h2>
            <ul className="space-y-3">
              {report.practiceQuestions.map((question: string, i: number) => (
                <li key={i} className="flex items-start pl-4 py-2 bg-slate-900/30 rounded">
                  <span className="text-teal-400 mr-2">{i + 1}.</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Encouragement Note - New component */}
        {report.encouragementNote && (
          <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-teal-900 mb-8 text-center">
            <p className="italic text-teal-300">{report.encouragementNote}</p>
          </div>
        )}
        
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
