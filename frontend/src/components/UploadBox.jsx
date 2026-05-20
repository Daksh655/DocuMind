import React, { useState, useRef } from 'react';
import api from '../services/api';

export default function UploadBox({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef(null);

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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setStatus('Successfully uploaded! AI indexing started.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Callback to refresh document list
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to upload document.');
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl max-w-xl mx-auto shadow-2xl transition duration-300 hover:shadow-cyan-950/20">
      <h3 className="text-xl font-semibold mb-4 text-cyan-400">Upload Study Materials</h3>
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
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
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
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 bg-red-950/20 rounded"
            >
              Remove
            </button>
          </div>
        )}

        {status && <div className="text-sm text-green-400 font-medium">{status}</div>}
        {error && <div className="text-sm text-red-400 font-medium">{error}</div>}

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg transition duration-200"
        >
          {uploading ? 'Processing File...' : 'Upload PDF'}
        </button>
      </form>
    </div>
  );
}
