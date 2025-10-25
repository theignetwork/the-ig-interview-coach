export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-md border border-slate-700">
        <div className="flex items-center justify-center mb-6">
          <div className="oracle-pro-badge">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">ORACLE PRO</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-6">
          Loading Practice Session
        </h1>
        <div className="space-y-4">
          <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
            <div
              className="bg-gradient-to-r from-teal-500 to-blue-500 h-2.5 rounded-full oracle-progress-bar"
            ></div>
          </div>
          <p className="text-center text-slate-300">
            Retrieving your questions from Oracle PRO...
          </p>
        </div>
      </div>
    </div>
  );
}
