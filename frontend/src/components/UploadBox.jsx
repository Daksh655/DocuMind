import React, { useState, useRef } from 'react';
import api from '../services/api';

export default function UploadBox({ onUploadSuccess }) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' or 'youtube'
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

  // --- PDF HANDLERS (Unchanged) ---
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF documents are supported.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
      setStatus('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');
    setStatus('Uploading file...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setStatus('Successfully uploaded! AI indexing started.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUploadSuccess) onUploadSuccess(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload document.');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  // --- NEW YOUTUBE HANDLER ---
  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setUploading(true);
    setError('');
    setStatus('Watching YouTube video and taking notes...');

    try {
      // Talk directly to the Python AI Engine!
      const response = await fetch('http://localhost:8000/api/ai/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl,
          // Generate a random ID so it enters global memory instantly
          file_id: Math.floor(Math.random() * 1000000)
        })
      });

      if (!response.ok) throw new Error("Failed to process video");

      setStatus('Video memorized! You can now ask questions about it in the chat.');
      setYoutubeUrl('');

      if (onUploadSuccess) onUploadSuccess({ id: Math.floor(Math.random() * 1000000), fileName: youtubeUrl, status: 'PROCESSED', uploadedAt: new Date().toISOString() });

      onUploadSuccess({
        id: Date.now(),
        fileName: youtubeUrl,
        status: 'PROCESSED',
        uploadedAt: new Date().toISOString()
      });

    } catch (err) {
      console.error(err);
      setError('Failed to extract video. Ensure the video has Closed Captions (Subtitles) enabled.');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  // --- UI RENDER ---
  return (
      <div className="glass p-6 rounded-2xl max-w-xl mx-auto shadow-2xl transition duration-300 hover:shadow-cyan-950/20">

        {/* Sleek Tab Navigation */}
        <div className="flex space-x-2 mb-6 bg-slate-900 p-1 rounded-xl">
          <button
              onClick={() => { setActiveTab('pdf'); setError(''); setStatus(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeTab === 'pdf' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            PDF Document
          </button>
          <button
              onClick={() => { setActiveTab('youtube'); setError(''); setStatus(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                  activeTab === 'youtube' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            YouTube Video
          </button>
        </div>

        {/* --- TAB 1: PDF UPLOAD UI --- */}
        {activeTab === 'pdf' && (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer transition relative">
                <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-slate-300">
                    <span className="text-cyan-400 font-semibold hover:underline">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-slate-500">PDF documents up to 50MB</p>
                </div>
              </div>

              {file && (
                  <div className="flex justify-between items-center text-sm bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <span className="truncate text-slate-200 font-medium">{file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-950/20 rounded">Remove</button>
                  </div>
              )}

              {status && <div className="text-sm text-green-400 font-medium">{status}</div>}
              {error && <div className="text-sm text-red-400 font-medium">{error}</div>}

              <button type="submit" disabled={!file || uploading} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg transition duration-200">
                {uploading ? 'Processing File...' : 'Upload PDF'}
              </button>
            </form>
        )}

        {/* --- TAB 2: YOUTUBE UI --- */}
        {activeTab === 'youtube' && (
            <form onSubmit={handleYoutubeSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Paste YouTube Video URL</label>
                <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={uploading}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl px-4 py-3 text-white outline-none transition"
                />
                <p className="text-xs text-slate-500 mt-2">Note: Video must have closed captions (subtitles) enabled to be readable.</p>
              </div>

              {status && <div className="text-sm text-green-400 font-medium">{status}</div>}
              {error && <div className="text-sm text-red-400 font-medium">{error}</div>}

              <button type="submit" disabled={!youtubeUrl.trim() || uploading} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg transition duration-200 flex justify-center items-center space-x-2">
                {uploading ? (
                    <span>Watching Video...</span>
                ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                      <span>Extract Knowledge</span>
                    </>
                )}
              </button>
            </form>
        )}

      </div>
  );
}