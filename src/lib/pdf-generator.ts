/**
 * PDF generation utilities for the Mock Job Interview Bot
 */

import { FeedbackReport, QuestionFeedback } from '@/lib/openai';

/**
 * Generates HTML content for the feedback report PDF
 * @param report Feedback report data
 * @param jobData Job description data
 * @returns HTML content for the PDF
 */
export function generateFeedbackReportHTML(report: FeedbackReport, jobData: any): string {
  // Format the score as a percentage
  const scorePercentage = Math.round(report.overallScore * 10);
  
  // Determine score color
  const scoreColor = scorePercentage >= 80 ? '#22c55e' : 
                     scorePercentage >= 60 ? '#f59e0b' : 
                     '#ef4444';
  
  // Generate HTML content
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interview Feedback Report</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .job-title {
          font-size: 20px;
          color: #4b5563;
          margin-bottom: 5px;
        }
        .date {
          font-size: 14px;
          color: #6b7280;
        }
        .score-section {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 30px 0;
        }
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background-color: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 30px;
          position: relative;
        }
        .score-value {
          font-size: 36px;
          font-weight: bold;
        }
        .score-label {
          position: absolute;
          bottom: -25px;
          font-size: 14px;
          color: #6b7280;
          width: 100%;
          text-align: center;
        }
        .score-details {
          flex: 1;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 2px solid #e5e7eb;
        }
        .summary {
          background-color: #f3f4f6;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        ul {
          margin-top: 10px;
          padding-left: 20px;
        }
        li {
          margin-bottom: 8px;
        }
        .strength {
          color: #22c55e;
        }
        .improvement {
          color: #f59e0b;
        }
        .question-feedback {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 15px;
          border-left: 4px solid #1e40af;
        }
        .question-text {
          font-weight: bold;
          margin-bottom: 10px;
        }
        .feedback-item {
          margin-bottom: 5px;
        }
        .question-score {
          display: inline-block;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #f3f4f6;
          text-align: center;
          line-height: 30px;
          font-weight: bold;
          margin-right: 10px;
        }
        .soar-box {
          background-color: #eff6ff;
          padding: 15px;
          border-radius: 5px;
          margin-top: 15px;
          border-left: 4px solid #3b82f6;
        }
        .soar-title {
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Mock Interview Bot</div>
          <div class="job-title">${jobData.jobTitle} at ${jobData.company}</div>
          <div class="date">Report Generated: ${new Date().toLocaleDateString()}</div>
        </div>
        
        <div class="score-section">
          <div class="score-circle" style="border: 8px solid ${scoreColor}">
            <div class="score-value" style="color: ${scoreColor}">${scorePercentage}</div>
            <div class="score-label">Overall Score</div>
          </div>
          <div class="score-details">
            <div class="summary">
              ${report.summary}
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">Key Strengths</div>
          <ul>
            ${report.strengths.map(strength => `<li class="strength">${strength}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <div class="section-title">Areas for Improvement</div>
          <ul>
            ${report.areasForImprovement.map(area => `<li class="improvement">${area}</li>`).join('')}
          </ul>
        </div>
        
        <div class="section">
          <div class="section-title">Question-by-Question Feedback</div>
          ${generateQuestionFeedbackHTML(report.questionFeedback)}
        </div>
        
        <div class="section">
          <div class="section-title">Recommended Next Steps</div>
          <ul>
            ${report.nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        
        <div class="footer">
          <p>This report was generated by the Mock Interview Bot. The feedback is based on AI analysis and should be used as a guide for improvement.</p>
          <p>© ${new Date().getFullYear()} Mock Interview Bot</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates HTML for question-by-question feedback
 * @param feedbackItems Question feedback items
 * @returns HTML content for question feedback
 */
function generateQuestionFeedbackHTML(feedbackItems: QuestionFeedback[]): string {
  return feedbackItems.map(item => {
    // Determine score color
    const scoreColor = item.score >= 8 ? '#22c55e' : 
                      item.score >= 6 ? '#f59e0b' : 
                      '#ef4444';
    
    return `
      <div class="question-feedback">
        <div class="question-text">
          <span class="question-score" style="background-color: ${scoreColor}; color: white;">${Math.round(item.score)}</span>
          ${item.question}
        </div>
        
        <div>
          <strong>Strengths:</strong>
          <ul>
            ${item.strengths.map(strength => `<li class="feedback-item">${strength}</li>`).join('')}
          </ul>
        </div>
        
        <div>
          <strong>Areas to Improve:</strong>
          <ul>
            ${item.weaknesses.map(weakness => `<li class="feedback-item">${weakness}</li>`).join('')}
          </ul>
        </div>
        
        <div class="soar-box">
          <div class="soar-title">SOAR Method Improvement</div>
          <p>${item.improvement}</p>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Generates a PDF from the feedback report
 * @param report Feedback report data
 * @param jobData Job description data
 * @returns PDF buffer
 */
export async function generateFeedbackPDF(report: FeedbackReport, jobData: any): Promise<Buffer> {
  try {
    // Generate HTML content
    const htmlContent = generateFeedbackReportHTML(report, jobData);
    
    // In a real implementation, we would use WeasyPrint to convert HTML to PDF
    // For the prototype, we'll simulate PDF generation
    
    console.log('Generating PDF from HTML content...');
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For the prototype, we'll return a placeholder Buffer
    // In the real implementation, this would be the actual PDF buffer
    return Buffer.from('Simulated PDF content');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}
