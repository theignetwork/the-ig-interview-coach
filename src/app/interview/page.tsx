"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { InterviewSession } from '@/components/interview/InterviewSession';

// Client component that safely uses window
function InterviewContent() {
  const router = useRouter();
  const [documentId, setDocumentId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [jobData, setJobData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  useEffect(() => {
    // Access window only on the client side
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const docId = searchParams.get('documentId');
      setDocumentId(docId);
      
      // Only set error if document is fully loaded and there's no documentId
      if (!docId && typeof document !== 'undefined' && document.readyState === 'complete') {
        // Add a small delay to ensure we're not showing error during navigation
        const timer = setTimeout(() => {
          setError('No document ID provided');
          setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []);
  
  useEffect(() => {
    if (!documentId) {
      return;
    }
    
    async function fetchQuestions() {
      try {
        // Only set loading to true if it's not already true
        if (!loading) {
          setLoading(true);
        }
        
        // For the prototype, we'll use mock data to ensure it works without backend
        // In a real implementation, we would fetch from the API
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for interview questions
        const mockData = {
          questions: [
            {
              id: "q1",
              text: "Can you describe your experience with React?",
              type: "technical",
              skill: "React",
              difficulty: "medium"
            },
            {
              id: "q2",
              text: "Tell me about a time when you had to troubleshoot a complex bug.",
              type: "behavioral",
              skill: "Problem-solving",
              difficulty: "medium"
            },
            {
              id: "q3",
              text: "How do you approach optimizing the performance of a web application?",
              type: "technical",
              skill: "Performance Optimization",
              difficulty: "hard"
            },
            {
              id: "q4",
              text: "Describe a situation where you had to learn a new technology quickly to complete a project.",
              type: "behavioral",
              skill: "Learning Agility",
              difficulty: "medium"
            },
            {
              id: "q5",
              text: "How would you implement state management in a large-scale React application?",
              type: "technical",
              skill: "State Management",
              difficulty: "hard"
            }
          ],
          jobData: {
            jobTitle: "Senior Frontend Developer",
            company: "Tech Innovations Inc.",
            requiredSkills: ["JavaScript", "React", "TypeScript", "Performance Optimization"],
            preferredSkills: ["Next.js", "GraphQL", "Redux"],
            responsibilities: ["Develop web applications", "Optimize performance", "Mentor junior developers"],
            qualifications: ["Bachelor's degree", "5+ years experience"],
            companyValues: ["Innovation", "Collaboration", "Quality"]
          },
          sessionId: `session_${Date.now()}`
        };
        
        setQuestions(mockData.questions);
        setJobData(mockData.jobData);
        setSessionId(mockData.sessionId);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError('Failed to generate interview questions. Please try again.');
        setLoading(false);
      }
    }
    
    fetchQuestions();
  }, [documentId, loading]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-white mb-6">Preparing Your Interview</h1>
          <div className="space-y-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
              <div className="bg-teal-500 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-center text-slate-300">
              Analyzing job description and generating relevant interview questions...
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
              onClick={() => router.push('/')}
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
            Position: {jobData?.jobTitle || 'Software Engineer'} at {jobData?.company || 'Tech Company'}
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

// Main page component with Suspense
export default function InterviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
          <h1 className="text-2xl font-bold text-center text-white mb-6">Loading Interview</h1>
          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
            <div className="bg-teal-500 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    }>
      <InterviewContent />
    </Suspense>
  );
}
