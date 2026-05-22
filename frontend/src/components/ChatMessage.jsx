import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatMessage({ message }) {
    const isAI = message.role === 'assistant';

    return (
        <div className={`flex w-full ${isAI ? 'justify-start' : 'justify-end'}`}>
            <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 text-sm shadow-md 
          ${isAI
                    ? 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                    : 'bg-cyan-600 text-white rounded-br-none'
                }`}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]} // 2. ADD THIS LINE TO FORCE LINKS TO BE CLICKABLE
                    components={{
                        h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold uppercase tracking-wider text-cyan-500 mt-6 mb-3 border-b border-slate-700 pb-1" />,
                        a: ({ node, ...props }) => (
                            <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 hover:text-cyan-300 font-medium underline break-words"
                            />
                        ),
                        ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 my-2 space-y-1" />,
                        p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />
                    }}
                >
                    {message.text}
                </ReactMarkdown>

                {/* Sources Tag (if available) */}
                {isAI && message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-500 mb-1 block">
              Retrieved Context:
            </span>
                        <ul className="text-xs text-slate-400 space-y-1">
                            {message.sources.map((source, idx) => (
                                <li key={idx}>• {source}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}