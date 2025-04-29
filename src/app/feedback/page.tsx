"use client";

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Client component that uses search params
function FeedbackContent() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Use useEffect to safely access window after component mount
  useEffect(() => {
    // Access window only on the client side
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setSessionId(searchParams.get('sessionId'));
    }
  }, []);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  
  useEffect(() => {
    if (!sessionId) {
      // Don't show error immediately, wait for sessionId to be set
      if (loading && typeof document !== 'undefined' && document.readyState === 'complete') {
        setError('No session ID provided');
        setLoading(false);
      }
      return;
    }
    
    async function fetchFeedback() {
      try {
        setLoading(true);
        
        // In a real implementation, we would fetch the session data from Supabase
        // For the prototype, we'll simulate this with mock data
        
        const mockSessionData = {
          sessionId,
          jobData: {
            jobTitle: "Software Engineer",
            company: "Tech Innovations Inc.",
            requiredSkills: ["JavaScript", "React", "Node.js", "TypeScript"],
            preferredSkills: ["Next.js", "GraphQL", "AWS"],
            responsibilities: ["Develop web applications", "Write clean code"],
            qualifications: ["Bachelor's degree", "3+ years experience"],
            companyValues: ["Innovation", "Collaboration", "Quality"]
          },
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
            }
          ],
          answers: {
            "q1": "I have been using React for about 3 years now. I've built several applications with it including e-commerce platforms and dashboards.",
            "q2": "I once had a memory leak issue in a React application. I used the Chrome DevTools to identify the problem and fixed it by properly cleaning up event listeners."
          },
          analyses: {
            "q1": {
              strengths: ["Shows experience with React", "Mentions specific applications"],
              weaknesses: ["Could provide more technical details", "No mention of performance optimization"],
              missingCompetencies: ["Component optimization"],
              score: 7.5,
              needsFollowUp: true
            },
            "q2": {
              strengths: ["Provides a specific example", "Mentions tools used for debugging"],
              weaknesses: ["Could elaborate more on the process", "No mention of collaboration"],
              missingCompetencies: [],
              score: 8.0,
              needsFollowUp: false
            }
          }
        };
        
        // Generate feedback report
        const response = await fetch('/api/feedback/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockSessionData),
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate feedback report');
        }
        
        const data = await response.json();
        
        setReport({
          overallScore: 8.0,
          summary: "You demonstrated good technical knowledge and problem-solving skills. Your answers were clear and included specific examples, which is excellent. To improve, consider adding more technical details and discussing collaboration aspects in your responses.",
          strengths: [
            "Clear communication with specific examples",
            "Good technical knowledge of React",
            "Effective problem-solving approach",
            "Practical experience with debugging tools"
          ],
          areasForImprovement: [
            "Include more technical details in responses",
            "Discuss performance optimization techniques",
            "Mention collaboration aspects of problem-solving",
            "Elaborate more on your troubleshooting process"
          ],
          nextSteps: [
            "Practice articulating technical concepts in more depth",
            "Prepare examples that highlight collaboration",
            "Research and be ready to discuss React performance optimization",
            "Develop a structured approach to explaining your debugging process"
          ],
          questionFeedback: [
            {
              question: "Can you describe your experience with React?",
              score: 7.5,
              strengths: ["Shows experience with React", "Mentions specific applications"],
              weaknesses: ["Could provide more technical details", "No mention of performance optimization"],
              improvement: "When discussing your React experience, use the SOAR method: Situation (describe specific projects), Obstacles (technical challenges you faced), Actions (how you implemented solutions, mentioning specific React features like hooks, context, or Redux), and Results (performance improvements, user feedback, or business impact)."
            },
            {
              question: "Tell me about a time when you had to troubleshoot a complex bug.",
              score: 8.0,
              strengths: ["Provides a specific example", "Mentions tools used for debugging"],
              weaknesses: ["Could elaborate more on the process", "No mention of collaboration"],
              improvement: "Enhance your debugging story using the SOAR framework: Situation (describe the application and the specific bug's impact), Obstacles (why the bug was challenging to find), Actions (detail your systematic approach, tools used, and how you collaborated with others), and Results (how you prevented similar issues in the future and any process improvements implemented)."
            }
          ]
        });
        setPdfUrl("/sample-feedback-report.pdf");
        setLoading(false);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError('Failed to generate feedback report. Please try again.');
        setLoading(false);
      }
    }
    
    fetchFeedback();
  }, [sessionId, loading]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Generating Your Feedback</h1>
          <div className="space-y-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-center text-gray-600">
              Analyzing your interview responses and creating your personalized feedback report...
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-red-600 mb-6">Error</h1>
          <p className="text-center text-gray-700 mb-6">{error}</p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!report) {
    return null;
  }
  
  // Format the score as a percentage
  const scorePercentage = Math.round(report.overallScore * 10);
  
  // Determine score color
  const scoreColor = scorePercentage >= 80 ? 'bg-green-500' : 
                     scorePercentage >= 60 ? 'bg-yellow-500' : 
                     'bg-red-500';
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Interview Feedback</h1>
          <p className="text-gray-600 mt-2">
            Session ID: {sessionId}
          </p>
        </header>
        
        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="flex items-center mb-6">
            <div className="relative mr-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${scoreColor}`}>
                <span className="text-2xl font-bold text-white">{scorePercentage}</span>
              </div>
              <div className="absolute -bottom-2 w-full text-center text-sm text-gray-500">
                Overall Score
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-gray-100 p-4 rounded-md">
                <p className="text-gray-800">{report.summary}</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-3 text-green-700">Key Strengths</h2>
              <ul className="list-disc pl-5 space-y-2">
                {report.strengths.map((strength: string, index: number) => (
                  <li key={index} className="text-gray-700">{strength}</li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3 text-yellow-700">Areas for Improvement</h2>
              <ul className="list-disc pl-5 space-y-2">
                {report.areasForImprovement.map((area: string, index: number) => (
                  <li key={index} className="text-gray-700">{area}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">Recommended Next Steps</h2>
            <ul className="list-disc pl-5 space-y-2">
              {report.nextSteps.map((step: string, index: number) => (
                <li key={index} className="text-gray-700">{step}</li>
              ))}
            </ul>
          </div>
          
          {pdfUrl && (
            <div className="flex justify-center mt-8">
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                Download Full PDF Report
              </a>
            </div>
          )}
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900">Question-by-Question Feedback</h2>
          
          <div className="space-y-8">
            {report.questionFeedback.map((feedback: any, index: number) => {
              // Determine score color
              const itemScoreColor = feedback.score >= 8 ? 'bg-green-500' : 
                                    feedback.score >= 6 ? 'bg-yellow-500' : 
                                    'bg-red-500';
              
              return (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-1">
                  <div className="flex items-center mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${itemScoreColor}`}>
                      <span className="text-sm font-bold text-white">{Math.round(feedback.score)}</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{feedback.question}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Strengths:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {feedback.strengths.map((strength: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700">{strength}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2">Areas to Improve:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {feedback.weaknesses.map((weakness: string, i: number) => (
                          <li key={i} className="text-sm text-gray-700">{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                    <h4 className="font-medium text-blue-700 mb-2">SOAR Method Improvement:</h4>
                    <p className="text-sm text-gray-700">{feedback.improvement}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Loading Feedback</h1>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  );
}
