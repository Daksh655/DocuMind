import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth';
import api from '../services/api';
import UploadBox from '../components/UploadBox';

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`/documents/user/${user.userId}`);
      setDocuments(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch uploaded documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user.userId) {
      navigate('/');
      return;
    }
    fetchDocuments();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navbar */}
      <nav className="glass border-b border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold tracking-tight text-white">
            Docu<span className="text-cyan-400">Mind</span>
          </Link>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-slate-300 hidden md:block">
              Welcome, <span className="font-semibold text-cyan-400">{user.email}</span>
            </span>
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Workspace</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload lectures, textbook chapters, or reference books. DocuMind will convert them to embeddings and query them to support your chat.
            </p>
          </div>
          <UploadBox onUploadSuccess={handleUploadSuccess} />
        </div>

        {/* Documents List Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl min-h-[500px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Your Syllabus Library</h2>
              <Link
                to="/chat"
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg transition"
              >
                Open AI Chat →
              </Link>
            </div>

            {error && (
              <div className="bg-red-950/30 text-red-400 border border-red-800/40 p-4 rounded-xl text-sm mb-6">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Loading library...
              </div>
            ) : documents.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3">
                <svg className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>No documents uploaded yet. Upload your first PDF to begin.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px] pr-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <svg className="h-6 w-6 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="truncate text-left">
                        <p className="text-slate-200 font-medium truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-slate-500">
                          Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          doc.status === 'PROCESSED'
                            ? 'bg-green-950/40 text-green-400 border border-green-800/40'
                            : doc.status === 'FAILED'
                            ? 'bg-red-950/40 text-red-400 border border-red-800/40'
                            : 'bg-yellow-950/40 text-yellow-400 border border-yellow-800/40 animate-pulse'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
