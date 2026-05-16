import { User, Bot, Copy, Check, RotateCcw } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function MessageBubble({ role, content, isStreaming, timestamp }) {
    const isUser = role === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderedContent = useMemo(() => {
        if (!content) return '';
        return renderMarkdown(content);
    }, [content]);

    const formattedTime = useMemo(() => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [timestamp]);

    return (
        <div className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isUser
                ? 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-md shadow-primary-600/20'
                : 'bg-gradient-to-br from-surface-100 to-surface-200 border border-surface-200 shadow-sm'
                }`}>
                {isUser
                    ? <User size={14} className="text-white" />
                    : <Bot size={14} className="text-surface-600" />
                }
            </div>

            {/* Message content */}
            <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${isUser
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-tr-sm shadow-md shadow-primary-600/15'
                    : 'bg-white border border-surface-200/80 text-surface-800 rounded-tl-sm shadow-sm'
                    } ${isStreaming ? 'pulse-glow' : ''}`}>
                    {isUser ? (
                        <div className={`whitespace-pre-wrap break-words prose-message prose-message-user`}>
                            {content}
                        </div>
                    ) : (
                        <div
                            className={`prose-message break-words ${isStreaming && content ? 'typing-cursor' : ''}`}
                            dangerouslySetInnerHTML={{ __html: renderedContent || (isStreaming ? '' : '') }}
                        />
                    )}
                </div>

                {/* Meta row: time + actions */}
                <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {formattedTime && (
                        <span className="text-[11px] text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {formattedTime}
                        </span>
                    )}
                    {!isUser && content && !isStreaming && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-surface-400 hover:text-surface-600 rounded-md hover:bg-surface-100 transition-all"
                                aria-label="Copy message"
                            >
                                {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Lightweight markdown renderer — handles the most common patterns
 * without pulling in a heavy dependency.
 */
function renderMarkdown(text) {
    // Escape HTML
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (```lang\n...\n```)
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Headings (### h3, ## h2, # h1)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered lists
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    // Ordered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Horizontal rules
    html = html.replace(/^---$/gm, '<hr>');

    // Paragraphs (double newlines)
    html = html.replace(/\n\n/g, '</p><p>');

    // Single newlines (within paragraphs) → <br> only if not inside pre/code
    html = html.replace(/(?<!<\/pre>|<\/code>|<\/li>|<\/ul>|<\/ol>|<\/h[123]>|<\/blockquote>|<\/hr>)\n(?!<pre|<code|<li|<ul|<ol|<h[123]|<blockquote|<hr)/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = `<p>${html}</p>`;
    }

    return html;
}
