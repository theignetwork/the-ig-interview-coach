import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile, processJobDescription } from '@/lib/document-processor';
import { validateFile } from '@/lib/validators/file-validators';
import { parseJobDescription } from '@/lib/openai';
import { storeJobDescription, getCurrentUser } from '@/lib/supabase';

/**
 * API route for document upload and processing
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    
    // Handle direct text input
    if (text) {
      if (text.length > 50000) {
        return NextResponse.json(
          { error: 'Text is too long. Maximum length is 50,000 characters.' },
          { status: 413 }
        );
      }
      
      const processedText = processJobDescription(text);
      
      // Parse the job description with GPT-4.1
      const parsedData = await parseJobDescription(processedText, user.id);
      
      // Store in Supabase
      const document = await storeJobDescription(
        user.id,
        parsedData.jobTitle,
        parsedData.company,
        processedText,
        parsedData
      );
      
      if (!document) {
        throw new Error('Failed to store document');
      }
      
      return NextResponse.json({
        success: true,
        documentId: document.id,
        content: processedText,
        parsedData,
      });
    }
    
    // Handle file upload
    if (!file) {
      return NextResponse.json(
        { error: 'No file or text provided' },
        { status: 400 }
      );
    }
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // Extract text from file
    const buffer = await file.arrayBuffer();
    const extractedText = await extractTextFromFile(buffer, file.type);
    const processedText = processJobDescription(extractedText);
    
    // Parse the job description with GPT-4.1
    const parsedData = await parseJobDescription(processedText, user.id);
    
    // Store in Supabase
    const document = await storeJobDescription(
      user.id,
      parsedData.jobTitle,
      parsedData.company,
      processedText,
      parsedData,
      {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        storagePath: `documents/${user.id}/${Date.now()}_${file.name}`
      }
    );
    
    if (!document) {
      throw new Error('Failed to store document');
    }
    
    return NextResponse.json({
      success: true,
      documentId: document.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      content: processedText,
      parsedData,
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}
