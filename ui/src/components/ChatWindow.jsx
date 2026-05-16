import { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import { Loader2, MessageSquare, Sparkles, ArrowDown } from 'lucide-react';
import { useState } from 'react';

export default function ChatWindow({ messages, isStreaming, streamingContent, onSuggestionClick }) {
    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent, isStreaming]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const hasMessages = messages.length > 0 || isStreaming;

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative"
        >
            {hasMessages ? (
                <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={msg.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}>
                            <MessageBubble role={msg.role} content={msg.content} />
                        </div>
                    ))}
                    {isStreaming && (
                        <div className="animate-fade-in-up">
                            <MessageBubble role="assistant" content={streamingContent} isStreaming />
                        </div>
                    )}
                    {isStreaming && !streamingContent && (
                        <div className="flex items-center gap-3 pl-12">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-surface-400 text-xs">Thinking...</span>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center px-4">
                    <div className="max-w-md text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-500/20">
                            <Sparkles size={28} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-surface-800 mb-3">
                            How can I help you today?
                        </h2>
                        <p className="text-surface-500 mb-8">
                            I'm your AI assistant with memory. Ask me anything and I'll remember our conversations.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <SuggestionCard
                                icon={<MessageSquare size={16} />}
                                text="Explain a concept"
                                onClick={onSuggestionClick}
                            />
                            <SuggestionCard
                                icon={<Sparkles size={16} />}
                                text="Help me brainstorm"
                                onClick={onSuggestionClick}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll to bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white border border-surface-200 rounded-full shadow-lg flex items-center justify-center text-surface-600 hover:text-surface-900 hover:shadow-xl transition-all"
                >
                    <ArrowDown size={18} />
                </button>
            )}
        </div>
    );
}

function SuggestionCard({ icon, text, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick?.(text)}
            className="flex items-center gap-3 px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-sm text-surface-600 hover:bg-surface-100 hover:border-surface-300 cursor-pointer transition-all text-left w-full"
        >
            <span className="text-primary-500">{icon}</span>
            <span>{text}</span>
        </button>
    );
}
