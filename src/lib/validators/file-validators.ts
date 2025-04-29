/**
 * File validation utilities for the Mock Job Interview Bot
 */

// Maximum file size (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed file types
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// File extensions for allowed types
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx'];

/**
 * Validates file size
 * @param file File to validate
 * @returns Validation result
 */
export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
    };
  }
  
  return { valid: true };
}

/**
 * Validates file type
 * @param file File to validate
 * @returns Validation result
 */
export function validateFileType(file: File): { valid: boolean; error?: string } {
  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    // Double-check extension as fallback
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload a PDF or DOCX file.',
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validates text content length
 * @param text Text content to validate
 * @returns Validation result
 */
export function validateTextLength(text: string): { valid: boolean; error?: string } {
  const MAX_TEXT_LENGTH = 50000;
  
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      valid: false,
      error: `Text length exceeds the maximum limit of 50,000 characters. Your text has ${text.length} characters.`,
    };
  }
  
  return { valid: true };
}

/**
 * Comprehensive file validation
 * @param file File to validate
 * @returns Validation result
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }
  
  // Check file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return { valid: true };
}
