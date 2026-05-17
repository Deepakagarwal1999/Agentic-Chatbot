import { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import { Sparkles, ArrowDown, Code, Lightbulb, BookOpen, Zap } from 'lucide-react';

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
            className="flex-1 overflow-y-auto relative"
            style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}
        >
            {hasMessages ? (
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                    {messages.map((msg, index) => (
                        <div
                            key={msg.id}
                            className="animate-fade-in-up"
                            style={{ animationDelay: `${Math.min(index * 30, 200)}ms` }}
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
                        <div className="flex items-start gap-3.5 animate-fade-in-up">
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-md shadow-primary-500/15 ring-2 ring-white">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-white border border-surface-200/80 rounded-2xl rounded-tl-md shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-primary-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-surface-400 text-sm font-medium">Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} className="h-4" />
                </div>
            ) : (
                <EmptyState onSuggestionClick={onSuggestionClick} />
            )}

            {/* Scroll to bottom button */}
            {showScrollBtn && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm border border-surface-200 rounded-full shadow-lg text-surface-600 hover:text-surface-900 hover:shadow-xl hover:bg-white transition-all animate-scale-in"
                    aria-label="Scroll to bottom"
                >
                    <ArrowDown size={14} />
                    <span className="text-xs font-medium">New messages</span>
                </button>
            )}
        </div>
    );
}

function EmptyState({ onSuggestionClick }) {
    const suggestions = [
        { icon: <Lightbulb size={18} />, title: 'Explain a concept', subtitle: 'Break down complex topics simply', color: 'from-amber-400 to-orange-500' },
        { icon: <Code size={18} />, title: 'Help me with code', subtitle: 'Debug, write, or review code', color: 'from-emerald-400 to-teal-500' },
        { icon: <Zap size={18} />, title: 'Brainstorm ideas', subtitle: 'Creative thinking partner', color: 'from-primary-400 to-purple-500' },
        { icon: <BookOpen size={18} />, title: 'Summarize content', subtitle: 'Condense long texts quickly', color: 'from-pink-400 to-rose-500' },
    ];

    return (
        <div className="h-full flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-lg text-center">
                {/* Logo / Icon */}
                <div className="relative mx-auto mb-8 w-20 h-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl rotate-6 opacity-20 blur-md scale-110"></div>
                    <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary-500/25">
                        <Sparkles size={32} className="text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-surface-900 mb-2">
                    How can I help you today?
                </h2>
                <p className="text-surface-500 mb-10 text-[15px] leading-relaxed">
                    I'm your AI assistant with memory. I remember our conversations and get better over time.
                </p>

                {/* Suggestion cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onSuggestionClick?.(s.title)}
                            className="group flex items-start gap-3 px-4 py-4 bg-white border border-surface-200/80 rounded-2xl text-left hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span className={`flex-shrink-0 w-9 h-9 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow`}>
                                {s.icon}
                            </span>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-surface-800 group-hover:text-primary-700 transition-colors">{s.title}</p>
                                <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">{s.subtitle}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
