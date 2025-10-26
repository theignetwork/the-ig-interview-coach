"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserInterviews, getUserStats, deleteInterview } from "@/lib/database/interview-service";
import { Trash2, TrendingUp, Calendar, Award, Target } from "lucide-react";

interface InterviewWithDetails {
  id: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  job_data: {
    title?: string;
    company?: string;
    description?: string;
  };
  questions: any[];
  answers: any[];
  feedback_reports: Array<{
    id: string;
    overall_score: number;
    summary: string;
    strengths: string[];
    areas_for_improvement: string[];
    next_steps: string[];
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
    lastInterviewDate: null as string | null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [interviewData, statsData] = await Promise.all([
        getUserInterviews(),
        getUserStats()
      ]);

      // Load Oracle sessions from localStorage
      const oracleInterviews = loadOracleInterviews();

      // Merge database interviews with Oracle interviews
      const allInterviews = [...interviewData, ...oracleInterviews];

      // Sort by created_at (most recent first)
      allInterviews.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setInterviews(allInterviews);

      // Update stats to include Oracle sessions
      const updatedStats = {
        ...statsData,
        totalInterviews: allInterviews.length,
        completedInterviews: allInterviews.filter(i => i.status === 'completed').length,
        lastInterviewDate: allInterviews.length > 0 ? allInterviews[0].created_at : null
      };

      setStats(updatedStats);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  const loadOracleInterviews = (): InterviewWithDetails[] => {
    try {
      const oracleInterviews: InterviewWithDetails[] = [];

      // Scan localStorage for oracle_interview_* keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('oracle_interview_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const oracleData = JSON.parse(data);

            // Transform Oracle data to match InterviewWithDetails format
            const interview: InterviewWithDetails = {
              id: oracleData.sessionId,
              created_at: new Date(oracleData.timestamp).toISOString(),
              completed_at: new Date(oracleData.timestamp).toISOString(),
              status: 'completed',
              job_data: {
                title: oracleData.jobDescription || 'Oracle PRO Interview',
                company: '',
                description: ''
              },
              questions: oracleData.questionsAndAnswers.map((qa: any, idx: number) => ({
                id: `oracle_q_${idx}`,
                text: qa.question,
                order_index: idx,
                type: 'oracle',
                skill: 'oracle',
                difficulty: 'medium',
                is_follow_up: false
              })),
              answers: oracleData.questionsAndAnswers.map((qa: any, idx: number) => ({
                id: `oracle_a_${idx}`,
                question_id: `oracle_q_${idx}`,
                content: qa.answer,
                created_at: new Date(oracleData.timestamp).toISOString()
              })),
              feedback_reports: [] // Oracle sessions shown with feedback from localStorage
            };

            oracleInterviews.push(interview);
          }
        }
      }

      console.log(`📊 Loaded ${oracleInterviews.length} Oracle sessions from localStorage`);
      return oracleInterviews;
    } catch (error) {
      console.error('Error loading Oracle interviews from localStorage:', error);
      return [];
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to delete this interview? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(interviewId);

      // Check if it's an Oracle session (stored in localStorage)
      if (interviewId.startsWith('oracle_practice_')) {
        // Delete from localStorage
        localStorage.removeItem(`oracle_interview_${interviewId}`);
        console.log('🗑️ Deleted Oracle session from localStorage:', interviewId);
      } else {
        // Delete from database
        await deleteInterview(interviewId);
      }

      // Reload data after deletion
      await loadDashboardData();
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting interview:", err);
      alert("Failed to delete interview. Please try again.");
      setDeletingId(null);
    }
  };

  const handleViewReport = (interviewId: string) => {
    // Add from_oracle flag for Oracle sessions
    if (interviewId.startsWith('oracle_practice_')) {
      router.push(`/feedback?sessionId=${interviewId}&from_oracle=true`);
    } else {
      router.push(`/feedback?sessionId=${interviewId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getHighestScore = () => {
    if (interviews.length === 0) return 0;
    const scores = interviews
      .map(i => i.feedback_reports[0]?.overall_score || 0)
      .filter(score => score > 0);
    return scores.length > 0 ? Math.max(...scores) : 0;
  };

  // Prepare data for line chart
  const chartData = interviews
    .filter(i => i.feedback_reports && i.feedback_reports.length > 0)
    .map(i => ({
      date: new Date(i.created_at),
      score: i.feedback_reports[0].overall_score
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const maxScore = 100;
  const minScore = Math.min(...chartData.map(d => d.score), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Interview Dashboard</h1>
          <p className="text-slate-400">Track your progress and review past performances</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Interviews */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-teal-500 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Target className="text-teal-400" size={24} />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Total</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalInterviews}</div>
            <div className="text-sm text-slate-400">Interviews Taken</div>
          </div>

          {/* Average Score */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-cyan-400" size={24} />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Average</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.averageScore > 0 ? stats.averageScore.toFixed(1) : "—"}
            </div>
            <div className="text-sm text-slate-400">Overall Score</div>
          </div>

          {/* Best Score */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-yellow-500 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-yellow-400" size={24} />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Best</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {getHighestScore() > 0 ? getHighestScore() : "—"}
            </div>
            <div className="text-sm text-slate-400">Highest Score</div>
          </div>

          {/* Last Interview */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-purple-500 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="text-purple-400" size={24} />
              <span className="text-xs text-slate-500 uppercase tracking-wide">Recent</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.lastInterviewDate ? formatDate(stats.lastInterviewDate).split(' ')[0] : "—"}
            </div>
            <div className="text-sm text-slate-400">
              {stats.lastInterviewDate ? formatDate(stats.lastInterviewDate) : "No interviews yet"}
            </div>
          </div>
        </div>

        {/* Score Progress Chart */}
        {chartData.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Score Over Time</h2>

            <div className="relative h-64 mb-4">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-sm text-slate-500 pr-2">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-12 h-full border-l border-b border-slate-700 relative">
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="border-t border-slate-700/50" />
                  ))}
                </div>

                {/* Line chart */}
                <svg className="absolute inset-0 w-full h-full overflow-visible">
                  {/* Draw connecting lines */}
                  {chartData.length > 1 && (
                    <polyline
                      points={chartData.map((point, i) => {
                        const x = (i / (chartData.length - 1)) * 100;
                        const y = 100 - ((point.score - minScore) / (maxScore - minScore)) * 100;
                        return `${x}%,${y}%`;
                      }).join(' ')}
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      className="drop-shadow-lg"
                    />
                  )}

                  {/* Draw points */}
                  {chartData.map((point, i) => {
                    const x = (i / (chartData.length - 1)) * 100;
                    const y = 100 - ((point.score - minScore) / (maxScore - minScore)) * 100;
                    return (
                      <g key={i}>
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="6"
                          fill="#14b8a6"
                          stroke="#0f766e"
                          strokeWidth="2"
                          className="drop-shadow-lg hover:r-8 transition-all cursor-pointer"
                        >
                          <title>{`Score: ${point.score} on ${point.date.toLocaleDateString()}`}</title>
                        </circle>
                        {/* Score label on hover */}
                        <text
                          x={`${x}%`}
                          y={`${y - 10}%`}
                          textAnchor="middle"
                          className="text-xs fill-teal-400 font-bold opacity-0 hover:opacity-100 transition-opacity"
                        >
                          {point.score}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X-axis labels */}
                <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-slate-500">
                  {chartData.map((point, i) => (
                    <span key={i} className="transform -rotate-0">
                      {point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
              <div className="w-3 h-3 rounded-full bg-teal-500"></div>
              <span>Your interview scores</span>
            </div>
          </div>
        )}

        {/* Recent Interviews List */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-6">Recent Interviews</h2>

          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No interviews yet</p>
              <button
                onClick={() => router.push("/")}
                className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
              >
                Start Your First Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {interviews.slice(0, 10).map((interview) => {
                const report = interview.feedback_reports[0];
                const score = report?.overall_score || 0;
                const hasReport = !!report;
                const isOracleSession = interview.id.startsWith('oracle_practice_');

                return (
                  <div
                    key={interview.id}
                    className="border border-slate-700 rounded-lg p-4 hover:border-teal-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {interview.job_data?.title || "Interview"}
                          </h3>
                          {isOracleSession && (
                            <span className="px-2 py-1 bg-gradient-to-r from-teal-500 to-blue-500 text-white text-xs font-semibold rounded">
                              ⚡ ORACLE PRO
                            </span>
                          )}
                          {interview.job_data?.company && (
                            <span className="text-slate-400">@</span>
                          )}
                          {interview.job_data?.company && (
                            <span className="text-teal-400">{interview.job_data.company}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>{formatDate(interview.created_at)}</span>
                          {hasReport && (
                            <>
                              <span>•</span>
                              <span className={`font-semibold ${
                                score >= 80 ? 'text-green-400' :
                                score >= 60 ? 'text-yellow-400' :
                                'text-orange-400'
                              }`}>
                                Score: {score}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>{interview.questions?.length || 0} questions</span>
                          <span>•</span>
                          <span>{interview.answers?.length || 0} answers</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasReport || isOracleSession ? (
                          <button
                            onClick={() => handleViewReport(interview.id)}
                            className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors text-sm font-medium"
                          >
                            View Report
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-slate-700 text-slate-400 rounded-md text-sm">
                            No Report
                          </span>
                        )}

                        <button
                          onClick={() => handleDeleteInterview(interview.id)}
                          disabled={deletingId === interview.id}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
                          title="Delete interview"
                        >
                          {deletingId === interview.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-400"></div>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Start New Interview Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg shadow-teal-500/25"
          >
            Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}
