import React from 'react';

export default function ChatMessage({ message }) {
  const { role, text, sources } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-lg ${
          isUser
            ? 'bg-cyan-600 text-white rounded-br-none'
            : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
        }`}
      >
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
        
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 pt-2 border-t border-slate-700">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Retrieved Context:
            </span>
            <ul className="list-disc list-inside text-xs text-slate-400 mt-1 space-y-0.5">
              {sources.map((source, index) => (
                <li key={index} className="truncate">
                  {source}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
