import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import api from '../services/api';
import ChatMessage from '../components/ChatMessage';

export default function ChatView() {
  const [query, setQuery] = useState('');

  // 1. Cooldown Timer State
  const [cooldown, setCooldown] = useState(0);

  // 2. Chat Memory Setup
  const defaultGreeting = {
    role: 'assistant',
    text: "Hello! I am DocuMind. Ask me any question, and I'll answer it strictly using the facts from your syllabus library.",
    sources: [],
  };

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("documind_chat_history");
    if (savedMessages) {
      try {
        return JSON.parse(savedMessages);
      } catch (e) {
        return [defaultGreeting];
      }
    }
    return [defaultGreeting];
  });

  const [loading, setLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [documents, setDocuments] = useState([]);

  const user = getCurrentUser();
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  // Auto-save chat to browser
  useEffect(() => {
    localStorage.setItem("documind_chat_history", JSON.stringify(messages));
  }, [messages]);

  // Cooldown Countdown Clock
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Fetch Documents
  useEffect(() => {
    if (!user.userId) {
      navigate('/');
      return;
    }
    const fetchDocs = async () => {
      try {
        const response = await api.get(`/documents/user/${user.userId}`);
        setDocuments(response.data.filter(d => d.status === 'PROCESSED'));
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, [navigate, user.userId]);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([defaultGreeting]);
    localStorage.removeItem("documind_chat_history");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    // Block sending if empty or cooldown is active
    if (!query.trim() || cooldown > 0) return;

    const userMessage = { role: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    // START THE COOLDOWN CLOCK!
    setCooldown(4);

    try {
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
      <div className="h-screen overflow-hidden bg-slate-950 flex flex-col">
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

            <div className="flex items-center space-x-4">
              <button
                  onClick={clearChat}
                  className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg transition outline-none focus:border-red-500"
              >
                Clear Chat
              </button>

              <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
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
                disabled={loading || cooldown > 0}
                className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-2xl px-5 py-4 text-white outline-none transition disabled:opacity-50"
                placeholder={cooldown > 0 ? "Cooling down..." : "Ask a question from your course syllabus..."}
            />
            <button
                type="submit"
                disabled={loading || !query.trim() || cooldown > 0}
                className={`rounded-2xl p-4 shadow-lg transition duration-200 shrink-0 w-14 h-14 flex items-center justify-center
              ${loading || !query.trim() || cooldown > 0
                    ? 'bg-slate-800 text-slate-500'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
            >
              {cooldown > 0 ? (
                  <span className="text-sm font-bold animate-pulse">{cooldown}s</span>
              ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
              )}
            </button>
          </form>
        </div>
      </div>
  );
}