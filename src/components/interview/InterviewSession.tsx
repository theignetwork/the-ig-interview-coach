"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff } from 'lucide-react';

interface InterviewSessionProps {
  questions: any[];
  jobData: any;
  sessionId: string;
}

export function InterviewSession({ questions: initialQuestions, jobData, sessionId }: InterviewSessionProps) {
  const router = useRouter();

  // ✅ Step 1: Core state setup for tracking interview flow
  const [questions, setQuestions] = useState<any[]>(initialQuestions); // now mutable
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false); // NEW: Claude thinking
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);

  // Optional analysis/mock scoring logic (untouched)
  const [analysisResults, setAnalysisResults] = useState<Record<string, any>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<any>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const currentQuestion = isFollowUp ? { text: followUpQuestion ?? "" } : questions[currentQuestionIndex];

  useEffect(() => {
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
        await audioRecorder.startRecording();
        setIsRecording(true);
      } else {
        const audioBlob = await audioRecorder.stopRecording();
        setIsRecording(false);

        setCurrentAnswer(currentAnswer + (currentAnswer ? '\n\n' : '') + "Transcribing audio...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        const transcription = "This is a simulated transcription of your voice recording.";
        setCurrentAnswer(currentAnswer.replace("Transcribing audio...", transcription));
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
      const updatedAnswers = [...answers, currentAnswer];
      setAnswers(updatedAnswers);

      // ✅ Step 1: Trigger follow-up generation if it's a main question
      const isMainQuestion = currentQuestionIndex % 2 === 0;

      if (isMainQuestion) {
        setIsLoadingFollowUp(true);

        const followUp = await getFollowUpFromClaude(
          questions[currentQuestionIndex]?.text,
          currentAnswer
        );

        setFollowUpQuestion(followUp);
        setIsFollowUp(true);
        setCurrentAnswer('');
        setIsLoadingFollowUp(false);
      } else {
        moveToNextQuestion();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      moveToNextQuestion();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitFollowUp = () => {
    if (!currentAnswer.trim() || isSubmitting) return;
    const updatedAnswers = [...answers, currentAnswer];
    setAnswers(updatedAnswers);
    setIsFollowUp(false);
    setFollowUpQuestion(null);
    setCurrentAnswer('');
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      handleInterviewComplete();
    }
  };

  const handleInterviewComplete = () => {
    router.push(`/feedback?sessionId=${sessionId}`);
  };

  const progressPercentage = ((currentQuestionIndex + (isFollowUp ? 0.5 : 1)) / (questions.length * 1.5)) * 100;

  const getFollowUpFromClaude = async (originalQuestion: string, userAnswer: string): Promise<string> => {
    const response = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalQuestion, userAnswer })
    });
    const data = await response.json();
    return data.followUpQuestion;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-300">
            Question {currentQuestionIndex + 1}{isFollowUp && " (Follow-Up)"} of {questions.length}
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
          {currentQuestion.text}
        </p>
        {isLoadingFollowUp && (
          <p className="mt-4 text-yellow-400">Thinking of a good follow-up…</p>
        )}
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

