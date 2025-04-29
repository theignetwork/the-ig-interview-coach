/**
 * Whisper API integration for voice recording and transcription
 */

import OpenAI from 'openai';
import { checkCircuitBreaker, trackTokenUsage } from './supabase';

// Initialize OpenAI client with a placeholder API key for development
// In production, this should use the actual API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder-key-for-development-only',
  dangerouslyAllowBrowser: true // Enable browser usage for development
});

/**
 * Transcribes audio using OpenAI's Whisper API
 * @param audioBlob Audio blob to transcribe
 * @param userId User ID for tracking
 * @param sessionId Optional session ID for tracking
 * @returns Transcribed text
 */
export async function transcribeAudio(
  audioBlob: Blob,
  userId: string,
  sessionId?: string
): Promise<string> {
  try {
    // Create form data for API request
    const formData = new FormData();
    formData.append('audio', audioBlob);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    // Call API route
    const response = await fetch('/api/whisper', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }
    
    const data = await response.json() as { text: string };
    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Gets the duration of an audio blob
 * @param audioBlob Audio blob
 * @returns Duration in seconds
 */
async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    audio.addEventListener('loadedmetadata', () => {
      const duration = audio.duration;
      URL.revokeObjectURL(audioUrl);
      resolve(duration);
    });
    
    // If there's an error or we can't get duration, estimate based on file size
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audioUrl);
      // Rough estimate: 16kHz * 16-bit * mono = ~32KB per second
      const estimatedDuration = audioBlob.size / 32000;
      resolve(estimatedDuration);
    });
  });
}

/**
 * Browser-side audio recording functionality
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  /**
   * Starts recording audio
   * @returns Promise that resolves when recording starts
   */
  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      // Set up event handlers
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      // Start recording
      this.mediaRecorder.start();
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }
  
  /**
   * Stops recording audio
   * @returns Promise that resolves with the recorded audio blob
   */
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }
      
      // Set up event handler for when recording stops
      this.mediaRecorder.addEventListener('stop', () => {
        // Stop all tracks in the stream
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        // Create blob from audio chunks
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        resolve(audioBlob);
        
        console.log('Recording stopped');
      });
      
      // Stop recording
      this.mediaRecorder.stop();
    });
  }
  
  /**
   * Checks if the browser supports audio recording
   * @returns Whether audio recording is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
}
