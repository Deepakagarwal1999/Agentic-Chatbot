import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function MessageBubble({ role, content, isStreaming }) {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser
                    ? 'bg-primary-600 shadow-md shadow-primary-600/20'
                    : 'bg-gradient-to-br from-surface-100 to-surface-200 border border-surface-200'
                }`}>
                {isUser
                    ? <User size={14} className="text-white" />
                    : <Bot size={14} className="text-surface-600" />
                }
            </div>

            {/* Message content */}
            <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                        ? 'bg-primary-600 text-white rounded-tr-md shadow-md shadow-primary-600/10'
                        : 'bg-white border border-surface-200 text-surface-800 rounded-tl-md shadow-sm'
                    } ${isStreaming ? 'pulse-glow' : ''}`}>
                    <div className={`whitespace-pre-wrap break-words ${isStreaming && content ? 'typing-cursor' : ''}`}>
                        {content || (isStreaming ? '' : '')}
                    </div>
                </div>

                {/* Actions (copy button for assistant messages) */}
                {!isUser && content && !isStreaming && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-surface-400 hover:text-surface-600 rounded-md hover:bg-surface-100 transition-all"
                        >
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
