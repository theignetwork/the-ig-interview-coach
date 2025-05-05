"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";

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
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [isLoadingFollowUp, setIsLoadingFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [finalsInjected, setFinalsInjected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState<any>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const currentQuestion = isFollowUp ? { text: followUpQuestion ?? "" } : questions[currentQuestionIndex];

  useEffect(() => {
    import("@/lib/whisper").then(({ AudioRecorder }) => {
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
      setRecordingError("Audio recording is not supported in your browser");
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

        setCurrentAnswer(currentAnswer + (currentAnswer ? "\n\n" : "") + "Transcribing audio...");

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");

        const response = await fetch("/.netlify/functions/transcribe", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        const transcription = data.transcript || "[No transcription available]";

        setCurrentAnswer(currentAnswer.replace("Transcribing audio...", transcription));
      }
    } catch (error) {
      console.error("Error with recording:", error);
      setIsRecording(false);
      setRecordingError("Failed to access microphone. Please check your permissions and try again.");
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
        setCurrentAnswer("");
        setIsLoadingFollowUp(false);
      } else {
        moveToNextQuestion();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
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
    setCurrentAnswer("");
    moveToNextQuestion();
  };

  const moveToNextQuestion = async () => {
    const hasMoreQuestions = currentQuestionIndex < questions.length - 1;

    if (hasMoreQuestions) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer("");
    } else if (!finalsInjected) {
      try {
        const finalQs = await getFinalQuestionsFromClaude();
        const extra = [{ text: finalQs.classic }, { text: finalQs.curveball }];
        setQuestions(prev => [...prev, ...extra]);
        setFinalsInjected(true);
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentAnswer("");
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
    <div className="max-w-3xl mx-auto p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700 text-white">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">
          {isFollowUp ? "Follow-Up Question" : `Question ${currentQuestionIndex + 1}`}
        </h2>
        <p className="text-slate-300">{currentQuestion.text}</p>
      </div>

      <textarea
        rows={6}
        value={currentAnswer}
        onChange={handleAnswerChange}
        placeholder="Type your answer here..."
        className="w-full p-4 text-white bg-slate-900 border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
      />

      {recordingError && (
        <p className="text-red-400 mb-4">{recordingError}</p>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={isFollowUp ? handleSubmitFollowUp : handleSubmitAnswer}
          disabled={!currentAnswer.trim() || isSubmitting}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : isFollowUp ? "Submit Follow-Up" : "Submit Answer"}
        </button>

        {audioRecorder && (
          <button
            onClick={toggleRecording}
            className={`ml-4 flex items-center gap-2 px-4 py-2 rounded ${
              isRecording ? "bg-red-600 hover:bg-red-700" : "bg-slate-600 hover:bg-slate-700"
            }`}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            {isRecording ? "Stop Recording" : "Record"}
          </button>
        )}
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div
          className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {isLoadingFollowUp && (
        <p className="text-slate-400 mt-4 animate-pulse">Generating follow-up question...</p>
      )}
    </div>
  );
}





