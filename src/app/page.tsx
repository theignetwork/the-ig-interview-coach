"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Sparkles, X } from "lucide-react";
import { jwtVerify } from "jose";

// Component that uses useSearchParams (must be wrapped in Suspense)
function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobText, setJobText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smartContextLoaded, setSmartContextLoaded] = useState(false);
  const [contextData, setContextData] = useState<any>(null);

  // Detect and decode smart context from URL hash fragment (or query param fallback)
  useEffect(() => {
    const loadContext = async () => {
      console.log('[Smart Context] Checking for context parameter...');
      // Read from hash fragment first
      const hash = window.location.hash.substring(1); // Remove the '#'
      const hashParams = new URLSearchParams(hash);
      let token = hashParams.get('context');

      // Fallback to query parameter for backwards compatibility
      if (!token) {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get('context');
      }

      console.log('[Smart Context] Token from URL:', token ? `${token.substring(0, 50)}...` : 'NOT FOUND');

      if (token) {
        try {
          console.log('[Smart Context] Attempting to decode JWT...');
          const secret = process.env.NEXT_PUBLIC_JWT_SECRET || 'your-secret-key-here';
          console.log('[Smart Context] Using secret:', secret);

          // Decode JWT token using jose (browser-compatible)
          const secretKey = new TextEncoder().encode(secret);
          const { payload } = await jwtVerify(token, secretKey);
          console.log('[Smart Context] Decoded payload:', payload);

          // Build job description from context
          const jobDescription = buildJobDescription(payload);
          console.log('[Smart Context] Built job description:', jobDescription.substring(0, 100));

          // Auto-fill the textarea
          setJobText(jobDescription);
          setContextData(payload);
          setSmartContextLoaded(true);

          // Clean URL (optional)
          window.history.replaceState({}, '', window.location.pathname);
          console.log('[Smart Context] SUCCESS - Context loaded!');
        } catch (err) {
          console.error('[Smart Context] Failed to decode context token:', err);
          // Don't show error to user - just fail silently
        }
      } else {
        console.log('[Smart Context] No context parameter found in URL');
      }
    };

    loadContext();
  }, []); // Run once on mount to check hash fragment

  // Helper to build job description from context data
  const buildJobDescription = (data: any): string => {
    let desc = '';

    if (data.companyName || data.positionTitle) {
      desc += `Company: ${data.companyName || 'Not specified'}\n`;
      desc += `Position: ${data.positionTitle || 'Not specified'}\n\n`;
    }

    if (data.location) desc += `Location: ${data.location}\n`;
    if (data.remoteType) desc += `Work Type: ${data.remoteType}\n`;
    if (data.salaryRange) desc += `Salary: ${data.salaryRange}\n`;
    if (data.location || data.remoteType || data.salaryRange) desc += '\n';

    if (data.jobDescription) {
      desc += `Job Description:\n${data.jobDescription}`;
    } else {
      desc += 'Job Description:\n(Details auto-loaded from Career Hub - please add more information if available)';
    }

    return desc;
  };

  const handleSubmit = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Save to localStorage
      localStorage.setItem("pastedJobDescription", jobText);

      // Generate a simple doc ID
      const mockDocumentId = `doc_${Date.now()}`;

      // Redirect to interview page
      router.push(`/interview?documentId=${mockDocumentId}`);
    } catch (err) {
      console.error("Error preparing interview:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            The IG Interview Coach
          </h1>
          <p className="text-xl text-slate-300">
            Practice your interview skills with AI-generated questions based on real job descriptions
          </p>
        </div>

        {/* Smart Context Banner */}
        {smartContextLoaded && (
          <div className="mb-6 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-2 border-teal-500/50 rounded-lg p-4 relative animate-fade-in">
            <button
              onClick={() => setSmartContextLoaded(false)}
              className="absolute top-2 right-2 text-teal-200 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <Sparkles className="text-teal-400" size={24} />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">
                  ✨ Job Details Auto-Loaded!
                </h3>
                <p className="text-teal-100 text-sm">
                  Context from <span className="font-semibold">{contextData?.companyName}</span> - {contextData?.positionTitle} has been automatically filled. You can edit the details below before starting your interview practice.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            Paste Job Description
          </h2>

          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste job description here..."
            rows={10}
            className="w-full p-4 rounded-md bg-slate-900 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          <button
            onClick={handleSubmit}
            disabled={!jobText.trim() || isProcessing}
            className="mt-4 px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
          >
            {isProcessing ? "Submitting..." : "Submit Text"}
          </button>

          {error && (
            <div className="mt-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
          <ol className="space-y-4 list-decimal list-inside text-slate-300">
            <li>Paste a job description into the box</li>
            <li>Our AI analyzes it and generates relevant interview questions</li>
            <li>Answer the questions as you would in a real interview</li>
            <li>Receive follow-up questions based on your responses</li>
            <li>Get feedback and improvement suggestions</li>
          </ol>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 mb-4">Already completed an interview?</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/25"
          >
            <BarChart3 size={20} />
            View Your Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}

// Main component with Suspense wrapper
export default function Home() {
  return (
    <Suspense fallback={
      <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-white">Loading...</div>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
