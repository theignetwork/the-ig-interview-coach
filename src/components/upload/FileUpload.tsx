"use client";

import { useState, useCallback, useEffect } from 'react';
import { Upload, File, X, Mic, MicOff } from 'lucide-react';
import { validateFile } from '@/lib/validators/file-validators';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  onTextSelected?: (text: string) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function FileUpload({
  onFileSelected,
  onTextSelected,
  maxSizeMB = 50,
  allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((file: File) => {
    setError(null);
    
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setSelectedFile(file);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleTextSubmit = useCallback(() => {
    if (!pastedText.trim()) {
      setError('Please enter some text');
      return;
    }
    
    if (pastedText.length > 50000) {
      setError(`Text is too long. Maximum length is 50,000 characters. Current length: ${pastedText.length}`);
      return;
    }
    
    setError(null);
    if (onTextSelected) {
      onTextSelected(pastedText);
    }
  }, [pastedText, onTextSelected]);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const [audioRecorder, setAudioRecorder] = useState<any>(null);
  
  // Initialize audio recorder on component mount
  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('@/lib/whisper').then(({ AudioRecorder }) => {
      if (AudioRecorder.isSupported()) {
        setAudioRecorder(new AudioRecorder());
      }
    });
  }, []);
  
  const toggleRecording = useCallback(async () => {
    if (!audioRecorder) {
      setError('Audio recording is not supported in your browser');
      return;
    }
    
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
        setPastedText(pastedText + (pastedText ? '\n\n' : '') + "Transcribing audio...");
        
        try {
          // In a real implementation, we would call the API
          // For now, simulate API call with a delay
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Simulate transcription result
          const transcription = "This is a simulated transcription of your voice recording. In the actual implementation, this would be the text returned by the Whisper API.";
          
          // Update text with transcription
          setPastedText(pastedText + (pastedText ? '\n\n' : '') + transcription);
        } catch (error) {
          console.error('Error transcribing audio:', error);
          setError('Failed to transcribe audio. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error with recording:', error);
      setIsRecording(false);
      setError('Failed to access microphone. Please check your permissions and try again.');
    }
  }, [isRecording, audioRecorder, pastedText]);

  return (
    <div className="w-full space-y-4">
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-md ${
            mode === 'upload' 
              ? 'bg-teal-500 text-white' 
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          Upload File
        </button>
        {onTextSelected && (
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`px-4 py-2 rounded-md ${
              mode === 'paste' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            Paste Text
          </button>
        )}
      </div>

      {mode === 'upload' && (
        <>
          {!selectedFile ? (
            <div
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer ${
                dragActive ? 'border-teal-500 bg-teal-900/20' : 'border-slate-600 bg-slate-800/50'
              } hover:bg-slate-700/50 transition-colors`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-teal-400" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-400">PDF or DOCX (Max {maxSizeMB}MB)</p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-slate-700/50 border border-slate-600 rounded-lg">
              <div className="flex items-center">
                <File className="w-8 h-8 mr-3 text-teal-400" />
                <div>
                  <p className="font-medium text-white">{selectedFile.name}</p>
                  <p className="text-sm text-slate-300">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 rounded-full hover:bg-slate-600"
                aria-label="Remove file"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>
          )}
        </>
      )}

      {mode === 'paste' && onTextSelected && (
        <div className="space-y-3">
          <div className="relative">
            <textarea
              className="w-full h-64 p-3 bg-slate-800 border border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-white placeholder-slate-400"
              placeholder="Paste job description here..."
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <button
              type="button"
              onClick={toggleRecording}
              className={`absolute bottom-3 right-3 p-2 rounded-full ${
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'bg-slate-700 text-white hover:bg-slate-600'
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleTextSubmit}
              className="px-4 py-2 text-white bg-teal-500 rounded-md hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Submit Text
            </button>
            {isRecording && (
              <div className="flex items-center text-red-400">
                <span className="inline-block w-3 h-3 mr-2 bg-red-500 rounded-full animate-pulse"></span>
                Recording...
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}
