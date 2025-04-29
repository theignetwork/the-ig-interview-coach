"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/upload/FileUpload';

export default function Home() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileSelected = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // For the prototype, we'll simulate a successful upload
      // In a real implementation, we would send to the API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock document ID
      const mockDocumentId = `doc_${Date.now()}`;
      
      // Navigate to interview page with document ID
      router.push(`/interview?documentId=${mockDocumentId}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload document');
      setIsUploading(false);
    }
  };
  
  const handleTextSelected = async (text: string) => {
    try {
      setIsUploading(true);
      setError(null);
      
      // For the prototype, we'll simulate a successful text processing
      // In a real implementation, we would send to the API
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a mock document ID
      const mockDocumentId = `doc_${Date.now()}`;
      
      // Navigate to interview page with document ID
      router.push(`/interview?documentId=${mockDocumentId}`);
    } catch (error) {
      console.error('Error processing text:', error);
      setError(error instanceof Error ? error.message : 'Failed to process text');
      setIsUploading(false);
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
        
        <div className="bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            Upload Job Description
          </h2>
          
          <FileUpload 
            onFileSelected={handleFileSelected}
            onTextSelected={handleTextSelected}
          />
          
          {isUploading && (
            <div className="mt-6">
              <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
                <div className="bg-teal-500 h-2.5 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
              <p className="text-center text-slate-300">
                Processing job description...
              </p>
            </div>
          )}
          
          {error && (
            <div className="mt-6 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-700">
              {error}
            </div>
          )}
        </div>
        
        <div className="mt-8 bg-slate-800 p-8 rounded-lg shadow-md border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-4">
            How It Works
          </h2>
          
          <ol className="space-y-4 list-decimal list-inside text-slate-300">
            <li>Upload a job description PDF/DOCX or paste the text</li>
            <li>Our AI analyzes the job requirements and generates relevant interview questions</li>
            <li>Answer the questions as you would in a real interview</li>
            <li>Receive follow-up questions based on your responses</li>
            <li>Get detailed feedback and improvement suggestions</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
