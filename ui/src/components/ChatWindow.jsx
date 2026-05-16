import { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import { Sparkles, ArrowDown, MessageSquare, Code, Lightbulb, BookOpen } from 'lucide-react';

export default function ChatWindow({ messages, isStreaming, streamingContent, onSuggestionClick }) {
    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        if (autoScroll) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streamingContent, isStreaming, autoScroll]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        setShowScrollBtn(distanceFromBottom > 100);
        setAutoScroll(distanceFromBottom < 50);
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        setAutoScroll(true);
    };

    const hasMessages = messages.length > 0 || isStreaming;

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto relative bg-surface-50/50"
        >
            {hasMessages ? (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
                        >
                            <MessageBubble
                                role={msg.role}
                                content={msg.content}
                                timestamp={msg.created_at}
                            />
                        </div>
                    ))}

                    {/* Streaming message */}
                    {isStreaming && streamingContent && (
                        <div className="animate-fade-in-up">
                            <MessageBubble role="assistant" content={streamingContent} isStreaming />
                        </div>
                    )}

                    {/* Thinking indicator */}
                    {isStreaming && !streamingContent && (
                        <div className="flex items-center gap-3 pl-11 animate-fade-in-up">
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 rounded-2xl rounded-tl-sm shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-surface-400 text-xs font-medium ml-1">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} className="h-1" />
                </div>
            ) : (
                <EmptyState onSuggestionClick={onSuggestionClick} />
            )}

            {/* Scroll to bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 right-4 w-9 h-9 bg-white border border-surface-200 rounded-full shadow-lg flex items-center justify-center text-surface-500 hover:text-surface-800 hover:shadow-xl hover:scale-105 transition-all animate-scale-in"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown size={16} />
                </button>
            )}
        </div>
    );
}

function EmptyState({ onSuggestionClick }) {
    const suggestions = [
        { icon: <Lightbulb size={16} />, title: 'Explain a concept', subtitle: 'Break down complex topics simply' },
        { icon: <Code size={16} />, title: 'Help me with code', subtitle: 'Debug, write, or review code' },
        { icon: <Sparkles size={16} />, title: 'Brainstorm ideas', subtitle: 'Creative thinking partner' },
        { icon: <BookOpen size={16} />, title: 'Summarize content', subtitle: 'Condense long texts quickly' },
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-lg text-center">
                {/* Logo / Icon */}
                <div className="relative mx-auto mb-8 w-20 h-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl rotate-6 opacity-20 blur-sm"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-primary-500/20">
                        <Sparkles size={32} className="text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-surface-900 mb-2">
                    How can I help you today?
                </h2>
                <p className="text-surface-500 mb-10 text-[15px]">
                    I'm your AI assistant with memory. I remember our conversations and get better over time.
                </p>

                {/* Suggestion cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onSuggestionClick?.(s.title)}
                            className="group flex items-start gap-3 px-4 py-3.5 bg-white border border-surface-200 rounded-xl text-left hover:border-primary-300 hover:shadow-md hover:shadow-primary-500/5 transition-all"
                        >
                            <span className="flex-shrink-0 w-8 h-8 bg-primary-50 text-primary-600 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                                {s.icon}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-surface-800 group-hover:text-primary-700 transition-colors">{s.title}</p>
                                <p className="text-xs text-surface-400 mt-0.5">{s.subtitle}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
