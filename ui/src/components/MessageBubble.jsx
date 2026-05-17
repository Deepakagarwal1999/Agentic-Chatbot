import { User, Bot, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
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
        <div className={`group flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {/* Assistant avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-md shadow-primary-500/15 ring-2 ring-white">
                    <Bot size={15} className="text-white" />
                </div>
            )}

            {/* Message content */}
            <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%] sm:max-w-[70%]`}>
                {/* Role label */}
                <span className={`text-[11px] font-semibold mb-1 px-0.5 tracking-wide uppercase ${isUser ? 'text-primary-500' : 'text-surface-400'}`}>
                    {isUser ? 'You' : 'Assistant'}
                    {formattedTime && (
                        <span className="ml-2 font-normal normal-case tracking-normal text-surface-300">
                            {formattedTime}
                        </span>
                    )}
                </span>

                <div className={`relative px-4 py-3 text-[14px] leading-relaxed ${isUser
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl rounded-tr-md shadow-lg shadow-primary-600/15'
                    : 'bg-white border border-surface-200/80 text-surface-800 rounded-2xl rounded-tl-md shadow-sm'
                    } ${isStreaming ? 'pulse-glow' : ''}`}>
                    {isUser ? (
                        <div className="whitespace-pre-wrap break-words prose-message prose-message-user">
                            {content}
                        </div>
                    ) : (
                        <div
                            className={`prose-message break-words ${isStreaming && content ? 'typing-cursor' : ''}`}
                            dangerouslySetInnerHTML={{ __html: renderedContent || '' }}
                        />
                    )}
                </div>

                {/* Action buttons for assistant messages */}
                {!isUser && content && !isStreaming && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-surface-400 hover:text-surface-700 rounded-lg hover:bg-surface-100 transition-all"
                            aria-label="Copy message"
                        >
                            {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                        <button
                            className="p-1.5 text-surface-300 hover:text-green-500 rounded-lg hover:bg-green-50 transition-all"
                            aria-label="Good response"
                        >
                            <ThumbsUp size={12} />
                        </button>
                        <button
                            className="p-1.5 text-surface-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-all"
                            aria-label="Bad response"
                        >
                            <ThumbsDown size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* User avatar */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shadow-md shadow-primary-700/15 ring-2 ring-white">
                    <User size={14} className="text-white" />
                </div>
            )}
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
        const langLabel = lang ? `<span class="code-lang">${lang}</span>` : '';
        return `<div class="code-block-wrapper">${langLabel}<pre><code class="language-${lang}">${code.trim()}</code></pre></div>`;
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

    // Single newlines → <br> only if not inside pre/code
    html = html.replace(/(?<!<\/pre>|<\/code>|<\/li>|<\/ul>|<\/ol>|<\/h[123]>|<\/blockquote>|<\/hr>|<\/div>)\n(?!<pre|<code|<li|<ul|<ol|<h[123]|<blockquote|<hr|<div)/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
        html = `<p>${html}</p>`;
    }

    return html;
}
