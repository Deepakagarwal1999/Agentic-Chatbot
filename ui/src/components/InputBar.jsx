import { useState, useRef } from 'react';
import { Send, Paperclip } from 'lucide-react';

export default function InputBar({ onSend, disabled }) {
    const [input, setInput] = useState('');
    const textareaRef = useRef(null);

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
        target.style.height = Math.min(target.scrollHeight, 200) + 'px';
        setInput(target.value);
    };

    return (
        <div className="border-t border-surface-200 bg-white/80 backdrop-blur-sm p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative flex items-end gap-2 bg-surface-50 border border-surface-200 rounded-2xl p-2 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-500/10 transition-all shadow-sm">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        disabled={disabled}
                        className="flex-1 px-3 py-2 bg-transparent resize-none max-h-[200px] text-sm text-surface-800 placeholder:text-surface-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ minHeight: '40px' }}
                    />
                    <button
                        type="submit"
                        disabled={disabled || !input.trim()}
                        className="flex-shrink-0 w-9 h-9 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary-600 flex items-center justify-center shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/30"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-xs text-surface-400 text-center mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </form>
        </div>
    );
}
