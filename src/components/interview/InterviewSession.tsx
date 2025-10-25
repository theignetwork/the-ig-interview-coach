"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff } from "lucide-react";
import { fetchJSONWithRetry, fetchWithRetry } from "@/lib/fetch-retry";

interface InterviewSessionProps {
  questions: any[];
  jobData: any;
  sessionId: string;
}

export function InterviewSession({ questions: initialQuestions, jobData: initialJobData, sessionId }: InterviewSessionProps) {
  const router = useRouter();

  // Function to extract job info from job description
  const extractJobInfo = (jobDescription: string | null) => {
    if (!jobDescription) {
      return { title: "Custom Role", company: "Company Name" };
    }
    
    // Try to extract job title
    let title = "Custom Role";
    let company = "Company Name";
    
    // Common patterns in job descriptions
    const titleRegex = /(?:job title|position|role|for a)\s*:?\s*([\w\s]+(?:developer|engineer|designer|manager|specialist|consultant|analyst|assistant|coordinator|director|lead|architect|officer|administrator|supervisor))/i;
    const companyRegex = /(?:at|for|with|by|company|organization)\s*:?\s*([A-Z][A-Za-z0-9\s&]+(?:Inc|LLC|Ltd|Corp|Company|Group|Technologies|Solutions|Associates)?)/;
    
    const titleMatch = jobDescription.match(titleRegex);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    const companyMatch = jobDescription.match(companyRegex);
    if (companyMatch && companyMatch[1]) {
      company = companyMatch[1].trim();
    }
    
    return { title, company };
  };

  // State variables
  const [jobData, setJobData] = useState(initialJobData);
  const [questions, setQuestions] = useState<any[]>(initialQuestions.slice(0, 3)); // Only use the first 3 questions initially
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
  const [recordingFormat, setRecordingFormat] = useState<string>("audio/webm");
  const [interviewStage, setInterviewStage] = useState<"main" | "final">("main");

  const currentQuestion = isFollowUp ? { text: followUpQuestion ?? "" } : questions[currentQuestionIndex];

  // Load audio recorder and enhance job data
  useEffect(() => {
    // Load audio recorder
    import("@/lib/whisper").then(({ AudioRecorder }) => {
      if (AudioRecorder.isSupported()) {
        setAudioRecorder(new AudioRecorder());
      }
    });
    
    // Try to extract job info from the stored job description
    const jobDescription = localStorage.getItem("pastedJobDescription");
    if (jobDescription) {
      const jobInfo = extractJobInfo(jobDescription);
      setJobData(prevData => ({
        ...prevData,
        jobTitle: jobInfo.title,
        company: jobInfo.company
      }));
    }
  }, []);

  // Handle text input
  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentAnswer(e.target.value);
  };

  // Calculate progress based on our 3+3+2 structure
  const calculateProgress = () => {
    // Total steps: 3 main questions + 3 follow-ups + 2 final questions = 8 steps
    const totalSteps = 8;
    
    let currentStep = 0;
    
    if (interviewStage === "main") {
      // During main questions (0, 1, 2)
      if (isFollowUp) {
        // Follow-up questions are odd steps (1, 3, 5)
        currentStep = (currentQuestionIndex * 2) + 1;
      } else {
        // Main questions are even steps (0, 2, 4)
        currentStep = currentQuestionIndex * 2;
      }
    } else {
      // Final questions (6, 7) - after all main Q+followups
      currentStep = 6 + currentQuestionIndex;
    }
    
    return (currentStep / totalSteps) * 100;
  };

  // Toggle audio recording
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

        // Log audio information for debugging
        console.log("Recorded audio MIME type:", audioBlob.type);
        console.log("Recorded audio size:", audioBlob.size, "bytes");
        
        // Check if recording has content
        if (!audioBlob || audioBlob.size < 100) {
          setRecordingError("The recording appears to be empty. Please try again or type your response.");
          return;
        }
        
        // Update the recording format state
        setRecordingFormat(audioBlob.type || "audio/webm");

        setCurrentAnswer(currentAnswer + (currentAnswer ? "\n\n" : "") + "Transcribing audio...");

        // Create a proper File object instead of using the Blob directly
        const fileName = `recording-${Date.now()}.webm`;
        const audioFile = new File([audioBlob], fileName, { 
          type: audioBlob.type || "audio/webm" 
        });

        const formData = new FormData();
        formData.append("file", audioFile);

        try {
          // Use retry logic for transcription (with different settings for file uploads)
          const response = await fetchWithRetry(
            "/.netlify/functions/transcribe",
            {
              method: "POST",
              body: formData,
            },
            {
              maxRetries: 2, // Fewer retries for large file uploads
              initialDelay: 2000, // Longer initial delay
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error:", errorText);
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          
          if (!data.text) {
            throw new Error("No transcription returned from server");
          }
          
          const transcription = data.text;
          
          // Replace the placeholder with the actual transcription
          setCurrentAnswer(currentAnswer => currentAnswer.replace("Transcribing audio...", transcription));
        } catch (transcriptionError) {
          console.error("Transcription error:", transcriptionError);
          // Replace the placeholder with an error message
          setCurrentAnswer(currentAnswer => 
            currentAnswer.replace("Transcribing audio...", "[Transcription failed. Please try again or type your response.]")
          );
          setRecordingError(`Transcription failed: ${transcriptionError.message || "Unknown error"}`);
        }
      }
    } catch (error) {
      console.error("Error with recording:", error);
      setIsRecording(false);
      setRecordingError("Failed to access microphone. Please check your permissions and try again.");
    }
  };

  // Submit answer for main questions
  const handleSubmitAnswer = async () => {
    // Ensure there's a meaningful answer (not just whitespace or very short)
    if (!currentAnswer.trim() || currentAnswer.trim().length < 3 || isSubmitting) {
      if (currentAnswer.trim().length < 3 && currentAnswer.trim().length > 0) {
        setRecordingError("Please provide a more detailed answer before submitting.");
      }
      return;
    }
    
    setIsSubmitting(true);
    setRecordingError(null); // Clear any previous errors

    try {
      const updatedAnswers = [...answers, currentAnswer];
      setAnswers(updatedAnswers);

      // Only generate follow-ups during main questions and if not already in a follow-up
      if (interviewStage === "main" && !isFollowUp) {
        setIsLoadingFollowUp(true);
        try {
          const followUp = await getFollowUpFromClaude(
            questions[currentQuestionIndex]?.text,
            currentAnswer
          );
          setFollowUpQuestion(followUp);
          setIsFollowUp(true);
          setCurrentAnswer("");
        } catch (followUpError) {
          console.error("Error getting follow-up:", followUpError);
          // Fallback follow-up that maintains the interview simulation
          setFollowUpQuestion("Can you elaborate more on your approach to that situation? Perhaps share a specific example.");
          setIsFollowUp(true);
          setCurrentAnswer("");
        } finally {
          setIsLoadingFollowUp(false);
        }
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

  // Submit answer for follow-up questions
  const handleSubmitFollowUp = () => {
    if (!currentAnswer.trim() || isSubmitting) return;
    const updatedAnswers = [...answers, currentAnswer];
    setAnswers(updatedAnswers);
    setIsFollowUp(false);
    setFollowUpQuestion(null);
    setCurrentAnswer("");
    moveToNextQuestion();
  };

  // Move to next question or stage
  const moveToNextQuestion = async () => {
    if (interviewStage === "main") {
      const isLastMainQuestion = currentQuestionIndex === 2;
      
      if (!isLastMainQuestion) {
        // Move to the next main question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer("");
      } else {
        // Transition to the final questions stage
        try {
          const finalQs = await getFinalQuestionsFromClaude();
          setQuestions([
            { text: finalQs.classic },
            { text: finalQs.curveball }
          ]);
          setInterviewStage("final");
          setCurrentQuestionIndex(0);
          setCurrentAnswer("");
        } catch (error) {
          console.error("Failed to fetch final Claude questions", error);
          handleInterviewComplete();
        }
      }
    } else {
      // In final stage
      const isLastFinalQuestion = currentQuestionIndex === 1;
      
      if (!isLastFinalQuestion) {
        // Move to the next final question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer("");
      } else {
        // Interview is complete
        handleInterviewComplete();
      }
    }
  };

  // Complete the interview
  const handleInterviewComplete = () => {
    // Save interview data to localStorage before navigating
    try {
      // Combine main questions and their follow-ups with final questions
      const allQuestionsAndAnswers = [];
      
      // First, collect the main questions and their follow-ups
      const mainQuestions = initialQuestions.slice(0, 3);
      for (let i = 0; i < mainQuestions.length; i++) {
        // Main question
        allQuestionsAndAnswers.push({
          question: mainQuestions[i].text,
          answer: answers[i*2] || ""
        });
        
        // Follow-up (if available in answers)
        if (answers[i*2 + 1]) {
          allQuestionsAndAnswers.push({
            question: `Follow-up: Related to the previous question`,
            answer: answers[i*2 + 1] || ""
          });
        }
      }
      
      // Add final questions
      if (answers.length > 6) {
        // Classic question
        allQuestionsAndAnswers.push({
          question: questions[0].text, // Classic question in final stage
          answer: answers[6] || ""
        });
      }
      
      if (answers.length > 7) {
        // Curveball question
        allQuestionsAndAnswers.push({
          question: questions[1].text, // Curveball question in final stage
          answer: answers[7] || ""
        });
      }
      
      const interviewData = {
        jobDescription: localStorage.getItem("pastedJobDescription"),
        sessionId: sessionId,
        timestamp: Date.now(),
        questionsAndAnswers: allQuestionsAndAnswers
      };
      
      localStorage.setItem(`interview_${sessionId}`, JSON.stringify(interviewData));
      console.log("Saved interview data to localStorage:", interviewData);
    } catch (error) {
      console.error("Error saving interview data:", error);
    }
    
    // Navigate to feedback page
    router.push(`/feedback?sessionId=${sessionId}`);
  };

  // Calculate progress percentage
  const progressPercentage = calculateProgress();

  // Get follow-up question from Claude
  const getFollowUpFromClaude = async (originalQuestion: string, userAnswer: string): Promise<string> => {
    if (!originalQuestion.trim() || !userAnswer.trim() || userAnswer.trim().length < 3) {
      return "I'd like to understand more about your approach. Could you give me a specific example from your experience?";
    }

    try {
      const data = await fetchJSONWithRetry(
        "/.netlify/functions/followup",
        { originalQuestion, userAnswer },
        { maxRetries: 3 }
      );

      return data.followUpQuestion || "Could you expand more on that answer with a concrete example?";
    } catch (error) {
      console.error("Error getting follow-up:", error);
      return "That's interesting. Can you tell me more about a specific situation where you demonstrated that skill?";
    }
  };

  // Get final classic and curveball questions
  const getFinalQuestionsFromClaude = async (): Promise<{ classic: string; curveball: string }> => {
    try {
      const data = await fetchJSONWithRetry(
        "/.netlify/functions/final-questions",
        undefined, // No body for GET request
        { maxRetries: 3 }
      );

      if (!data.classic || !data.curveball) {
        throw new Error("Missing classic or curveball questions");
      }

      return {
        classic: data.classic,
        curveball: data.curveball
      };
    } catch (error) {
      console.error("Error getting final questions:", error);
      // Fallback questions
      return {
        classic: "What would you say are your greatest strengths, and how do they align with this role?",
        curveball: "If you could have dinner with any three people, living or dead, who would they be and why?"
      };
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-800 rounded-lg shadow-md border border-slate-700 text-white">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">
          {isFollowUp ? "Follow-Up Question" : (
            interviewStage === "main" 
              ? `Question ${currentQuestionIndex + 1} of 3` 
              : `${currentQuestionIndex === 0 ? "Traditional" : "Curveball"} Question`
          )}
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

      {recordingFormat && recordingFormat !== "audio/webm" && (
        <p className="text-yellow-400 mb-4">
          Your browser is recording in {recordingFormat} format. If you experience issues, try typing your response instead.
        </p>
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

      {/* Updated progress indicator to show percentage instead of fraction */}
      <div className="mt-2 text-right text-sm text-slate-400">
        {interviewStage === "main" 
          ? `${isFollowUp ? "Follow-up Question" : "Progress"}: ${Math.floor(progressPercentage)}%`
          : `Final Questions: ${Math.floor(progressPercentage)}%`
        }
      </div>

      {isLoadingFollowUp && (
        <p className="text-slate-400 mt-4 animate-pulse">Generating follow-up question...</p>
      )}
    </div>
  );
}






