import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import api from '../services/api';
import ChatMessage from '../components/ChatMessage';

export default function ChatView() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am DocuMind. Ask me any question, and I'll answer it strictly using the facts from your syllabus library.",
      sources: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [documents, setDocuments] = useState([]);
  
  const user = getCurrentUser();
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (!user.userId) {
      navigate('/');
      return;
    }

    // Load user's documents to filter chat if necessary
    const fetchDocs = async () => {
      try {
        const response = await api.get(`/documents/user/${user.userId}`);
        // Only allow searching processed documents
        setDocuments(response.data.filter(d => d.status === 'PROCESSED'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, []);

  // Auto-scroll chat window to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      // Direct call to FastAPI server for AI responses.
      // Since Docker compose maps FastAPI internally or via localhost:8000
      const response = await api.post('http://localhost:8000/api/ai/chat', {
        query: userMessage.text,
        user_id: parseInt(user.userId),
        document_id: selectedDocId ? parseInt(selectedDocId) : null
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.data.answer,
          sources: response.data.sources,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Error communicating with Python AI Engine. Please check that Docker containers are running properly.',
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Navbar */}
      <nav className="glass border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-slate-400 hover:text-white font-medium text-sm transition">
              ← Back to Library
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-lg font-bold text-white">AI Learning Workspace</span>
          </div>

          {/* Optional document filter dropdown */}
          <div className="flex items-center space-x-3">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Focus Document:</label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="">Query Full Library</option>
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </nav>

      {/* Messages Box */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 rounded-bl-none text-slate-400 text-sm flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="pl-1">Searching and reading sources...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Box Form */}
      <div className="border-t border-slate-800 p-6 glass">
        <form onSubmit={handleSend} className="max-w-5xl mx-auto flex items-center space-x-3">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-2xl px-5 py-4 text-white outline-none transition"
            placeholder="Ask a question from your course syllabus..."
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-2xl p-4 shadow-lg transition duration-200 shrink-0"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
