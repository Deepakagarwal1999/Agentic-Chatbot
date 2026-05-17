import { useState, useRef, useEffect } from 'react';
import { Send, Square, Paperclip } from 'lucide-react';

export default function InputBar({ onSend, disabled }) {
    const [input, setInput] = useState('');
    const textareaRef = useRef(null);

    // Auto-focus on mount
    useEffect(() => {
        if (!disabled) {
            textareaRef.current?.focus();
        }
    }, [disabled]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim() || disabled) return;
        onSend(input.trim());
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleInput = (e) => {
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = Math.min(target.scrollHeight, 180) + 'px';
        setInput(target.value);
    };

    const charCount = input.length;
    const showCharCount = charCount > 500;

    return (
        <div className="bg-white/80 backdrop-blur-sm border-t border-surface-100 p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-white border border-surface-200 rounded-2xl px-3 py-2 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/8 transition-all shadow-sm hover:shadow-md">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? 'Waiting for response...' : 'Message the assistant...'}
                        rows={1}
                        disabled={disabled}
                        className="flex-1 px-2 py-2.5 bg-transparent resize-none max-h-[180px] text-[14px] text-surface-800 placeholder:text-surface-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                        style={{ minHeight: '42px' }}
                        aria-label="Message input"
                    />
                    <div className="flex items-center gap-1.5 pb-1">
                        <button
                            type="submit"
                            disabled={disabled || !input.trim()}
                            className={`flex-shrink-0 w-9 h-9 rounded-xl transition-all duration-200 flex items-center justify-center ${disabled
                                ? 'bg-surface-100 text-surface-400 cursor-not-allowed'
                                : input.trim()
                                    ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md shadow-primary-600/20 hover:shadow-lg hover:scale-105'
                                    : 'bg-surface-100 text-surface-400 cursor-not-allowed'
                                }`}
                            aria-label={disabled ? 'Waiting' : 'Send message'}
                        >
                            {disabled ? (
                                <Square size={14} className="animate-pulse" />
                            ) : (
                                <Send size={15} />
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2 px-2">
                    <p className="text-[11px] text-surface-400">
                        <kbd className="px-1.5 py-0.5 bg-surface-50 border border-surface-200 rounded text-[10px] font-mono">Enter</kbd>
                        <span className="mx-1">to send</span>
                        <span className="text-surface-300">·</span>
                        <kbd className="ml-1 px-1.5 py-0.5 bg-surface-50 border border-surface-200 rounded text-[10px] font-mono">Shift+Enter</kbd>
                        <span className="ml-1">for new line</span>
                    </p>
                    {showCharCount && (
                        <span className={`text-[11px] font-medium ${charCount > 4000 ? 'text-red-500' : 'text-surface-400'}`}>
                            {charCount.toLocaleString()}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
