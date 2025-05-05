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

  const [questions, setQuestions] = useState<any[]>(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [finalsInjected, setFinalsInjected] = useState(false); // NEW

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

  // ✅ UPDATED: Smart injection of classic + curveball questions at the end
  const moveToNextQuestion = async () => {
    const hasMoreQuestions = currentQuestionIndex < questions.length - 1;

    if (hasMoreQuestions) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else if (!finalsInjected) {
      try {
        const finalQs = await getFinalQuestionsFromClaude();
        const extra = [{ text: finalQs.classic }, { text: finalQs.curveball }];
        setQuestions(prev => [...prev, ...extra]);
        setFinalsInjected(true);
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer('');
      } catch (error) {
        console.error("Failed to fetch final Claude questions", error);
        handleInterviewComplete();
      }
    } else {
      handleInterviewComplete();
    }
  };

  const handleInterviewComplete = () => {
    router.push(`/feedback?sessionId=${sessionId}`);
  };

  const progressPercentage = ((currentQuestionIndex + (isFollowUp ? 0.5 : 1)) / (questions.length * 1.5)) * 100;

  const getFollowUpFromClaude = async (originalQuestion: string, userAnswer: string): Promise<string> => {
    const response = await fetch("/.netlify/functions/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalQuestion, userAnswer })
    });
    const data = await response.json();
    return data.followUpQuestion;
  };

  const getFinalQuestionsFromClaude = async (): Promise<{ classic: string; curveball: string }> => {
    const res = await fetch("/.netlify/functions/final-questions");
    const data = await res.json();

    if (!data.classic || !data.curveball) {
      throw new Error("Missing classic or curveball questions");
    }

    return {
      classic: data.classic,
      curveball: data.curveball
    };
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700">
      {/* ... UI stays unchanged ... */}
      {/* You can keep your existing JSX layout here exactly as it is */}
    </div>
  );
}



