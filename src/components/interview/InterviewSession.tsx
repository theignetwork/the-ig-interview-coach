"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff } from 'lucide-react';

interface InterviewSessionProps {
  questions: any[];
  jobData: any;
  sessionId: string;
}

export function InterviewSession({ questions, jobData, sessionId }: InterviewSessionProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<any>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  // Initialize audio recorder on component mount
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/lib/whisper').then(({ AudioRecorder }) => {
      if (AudioRecorder.isSupported()) {
        setAudioRecorder(new AudioRecorder());
      }
    });
  }, []);
  
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAnswer(e.target.value);
  };
  
  const toggleRecording = async () => {
    if (!audioRecorder) {
      setRecordingError('Audio recording is not supported in your browser');
      return;
    }
    
    setRecordingError(null);
    
    try {
      if (!isRecording) {
        // Start recording
        await audioRecorder.startRecording();
        setIsRecording(true);
      } else {
        // Stop recording and get audio blob
        const audioBlob = await audioRecorder.stopRecording();
        setIsRecording(false);
        
        // Show processing message
        setCurrentAnswer(currentAnswer + (currentAnswer ? '\n\n' : '') + "Transcribing audio...");
        
        try {
          // In a real implementation, we would call the API
          // For now, simulate API call with a delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate transcription result
          const transcription = "This is a simulated transcription of your voice recording. In the actual implementation, this would be the text returned by the Whisper API.";
          
          // Update text with transcription
          setCurrentAnswer(currentAnswer.replace("Transcribing audio...", transcription));
        } catch (error) {
          console.error('Error transcribing audio:', error);
          setRecordingError('Failed to transcribe audio. Please try again.');
          setCurrentAnswer(currentAnswer.replace("Transcribing audio...", ""));
        }
      }
    } catch (error) {
      console.error('Error with recording:', error);
      setIsRecording(false);
      setRecordingError('Failed to access microphone. Please check your permissions and try again.');
    }
  };
  
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Store the answer
      const questionId = currentQuestion.id;
      const updatedAnswers = {
        ...answers,
        [questionId]: currentAnswer
      };
      setAnswers(updatedAnswers);
      
      // For the prototype, we'll simulate the analysis with mock data
      // In a real implementation, we would call the API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock analysis result
      const mockAnalysis = {
        strengths: ["Provides specific examples", "Shows technical knowledge"],
        weaknesses: ["Could be more concise", "Missing some key competencies"],
        missingCompetencies: currentQuestionIndex === 1 ? ["Problem-solving methodology"] : [],
        score: 7.5 + Math.random() * 1.5,
        needsFollowUp: currentQuestionIndex === 1 // Only generate follow-up for the second question
      };
      
      // Store analysis result
      const updatedAnalysisResults = {
        ...analysisResults,
        [questionId]: mockAnalysis
      };
      setAnalysisResults(updatedAnalysisResults);
      
      // Check if follow-up is needed
      if (mockAnalysis.needsFollowUp) {
        setFollowUpQuestion("Can you elaborate on your problem-solving methodology? What specific steps do you take when approaching a complex issue?");
        setIsFollowUp(true);
        setCurrentAnswer('');
      } else {
        // Move to next question if no follow-up
        moveToNextQuestion();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Move to next question even if analysis fails
      moveToNextQuestion();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSubmitFollowUp = () => {
    if (!currentAnswer.trim() || isSubmitting) return;
    
    // Store the follow-up answer with the original question
    const questionId = currentQuestion.id;
    const updatedAnswers = {
      ...answers,
      [`${questionId}_followup`]: currentAnswer
    };
    setAnswers(updatedAnswers);
    
    // Reset follow-up state
    setFollowUpQuestion(null);
    setIsFollowUp(false);
    setCurrentAnswer('');
    
    // Move to next question
    moveToNextQuestion();
  };
  
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // Interview completed
      handleInterviewComplete();
    }
  };
  
  const handleInterviewComplete = () => {
    // Navigate to feedback page
    router.push(`/feedback?sessionId=${sessionId}`);
  };
  
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-300">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-slate-300">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div 
            className="bg-teal-500 h-2.5 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          {isFollowUp ? 'Follow-up Question' : `Question ${currentQuestionIndex + 1}`}
        </h2>
        <p className="text-white p-4 bg-slate-700 rounded-lg border border-slate-600">
          {isFollowUp ? followUpQuestion : currentQuestion.text}
        </p>
        <div className="mt-2 flex items-center text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentQuestion.difficulty === 'easy' ? 'bg-green-900/50 text-green-300' :
            currentQuestion.difficulty === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
            'bg-red-900/50 text-red-300'
          }`}>
            {currentQuestion.difficulty.charAt(0).toUpperCase() + currentQuestion.difficulty.slice(1)}
          </span>
          <span className="mx-2 text-slate-400">•</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentQuestion.type === 'technical' ? 'bg-purple-900/50 text-purple-300' :
            currentQuestion.type === 'behavioral' ? 'bg-blue-900/50 text-blue-300' :
            'bg-indigo-900/50 text-indigo-300'
          }`}>
            {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor="answer" className="block text-sm font-medium text-slate-300 mb-2">
          Your Answer
        </label>
        <div className="relative">
          <textarea
            id="answer"
            rows={6}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-white placeholder-slate-400"
            placeholder="Type your answer here or use voice recording..."
            value={currentAnswer}
            onChange={handleAnswerChange}
          ></textarea>
          <button
            type="button"
            onClick={toggleRecording}
            className={`absolute bottom-3 right-3 p-2 rounded-full ${
              isRecording 
                ? 'bg-red-500 text-white' 
                : 'bg-slate-600 text-white hover:bg-slate-500'
            }`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
        {isRecording && (
          <div className="mt-2 flex items-center text-red-400">
            <span className="inline-block w-3 h-3 mr-2 bg-red-500 rounded-full animate-pulse"></span>
            Recording...
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50"
          onClick={isFollowUp ? handleSubmitFollowUp : handleSubmitAnswer}
          disabled={!currentAnswer.trim() || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}
