import { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

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
        <div className="border-t border-surface-200/80 bg-white p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-surface-50 border border-surface-200 rounded-2xl p-2 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:bg-white transition-all shadow-sm hover:shadow-md hover:border-surface-300">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? 'Waiting for response...' : 'Type your message...'}
                        rows={1}
                        disabled={disabled}
                        className="flex-1 px-3 py-2.5 bg-transparent resize-none max-h-[180px] text-[14px] text-surface-800 placeholder:text-surface-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                        style={{ minHeight: '42px' }}
                        aria-label="Message input"
                    />
                    <button
                        type="submit"
                        disabled={disabled || !input.trim()}
                        className={`flex-shrink-0 w-9 h-9 rounded-xl transition-all flex items-center justify-center ${disabled
                            ? 'bg-surface-200 text-surface-400 cursor-not-allowed'
                            : input.trim()
                                ? 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30 hover:scale-105'
                                : 'bg-surface-200 text-surface-400 cursor-not-allowed'
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
                <div className="flex items-center justify-between mt-1.5 px-2">
                    <p className="text-[11px] text-surface-400">
                        <kbd className="px-1 py-0.5 bg-surface-100 border border-surface-200 rounded text-[10px] font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-surface-100 border border-surface-200 rounded text-[10px] font-mono">Shift+Enter</kbd> for new line
                    </p>
                    {showCharCount && (
                        <span className={`text-[11px] ${charCount > 4000 ? 'text-red-500' : 'text-surface-400'}`}>
                            {charCount.toLocaleString()}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
