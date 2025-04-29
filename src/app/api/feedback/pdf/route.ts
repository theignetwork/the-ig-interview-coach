import { NextRequest, NextResponse } from 'next/server';
import { generateFeedbackPDF } from '@/lib/pdf-generator';
import { uploadPDF, getCurrentUser } from '@/lib/supabase';

/**
 * API route for generating PDF feedback reports
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

    const data = await request.json() as {
      reportId: string;
      report: any;
      jobData: any;
    };
    
    const { reportId, report, jobData } = data;
    
    if (!reportId || !report || !jobData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate PDF
    const pdfBuffer = await generateFeedbackPDF(report, jobData);
    
    // Upload to Supabase Storage
    const pdfPath = `feedback_pdfs/${user.id}/${reportId}.pdf`;
    const pdfUrl = await uploadPDF('feedback_pdfs', pdfPath, pdfBuffer);
    
    if (!pdfUrl) {
      throw new Error('Failed to upload PDF');
    }
    
    // Update feedback report with PDF URL
    await updateFeedbackReportPDF(reportId, pdfUrl);
    
    return NextResponse.json({
      success: true,
      pdfUrl
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

/**
 * Updates a feedback report with the PDF URL
 * @param reportId Feedback report ID
 * @param pdfUrl PDF URL
 */
async function updateFeedbackReportPDF(reportId: string, pdfUrl: string) {
  const { supabaseAdmin } = await import('@/lib/supabase');
  
  await supabaseAdmin
    .from('feedback_reports')
    .update({ pdf_path: pdfUrl })
    .eq('id', reportId);
}
