import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import * as conversationsApi from '../api/conversations';
import * as messagesApi from '../api/messages';
import { Menu, X, AlertCircle } from 'lucide-react';

export default function ChatPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Load conversations
    const loadConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const data = await conversationsApi.listConversations({ limit: 50 });
            setConversations(data.items);
        } catch (err) {
            setError(err.message || 'Failed to load conversations');
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    // Load messages for active conversation
    const loadMessages = useCallback(async (id) => {
        if (!id) return;
        setLoadingMessages(true);
        try {
            const data = await messagesApi.listMessages(id, { limit: 100 });
            setMessages(data.items);
        } catch (err) {
            setError(err.message || 'Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Set active conversation from URL on initial load
    useEffect(() => {
        if (conversations.length > 0 && !activeConversationId) {
            const urlId = searchParams.get('c');
            if (urlId) {
                setActiveConversationId(urlId);
            } else {
                setActiveConversationId(conversations[0].id);
                setSearchParams({ c: conversations[0].id });
            }
        }
    }, [conversations, activeConversationId, searchParams, setSearchParams]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        } else {
            setMessages([]);
        }
    }, [activeConversationId, loadMessages]);

    const handleSelectConversation = (id) => {
        setActiveConversationId(id);
        setSearchParams({ c: id });
        setMessages([]);
        setError('');
        setSidebarOpen(false);
    };

    const handleCreateConversation = async () => {
        try {
            const newConv = await conversationsApi.createConversation('New Conversation');
            setConversations(prev => [newConv, ...prev]);
            setActiveConversationId(newConv.id);
            setSearchParams({ c: newConv.id });
            setMessages([]);
            setError('');
        } catch (err) {
            setError(err.message || 'Failed to create conversation');
        }
    };

    const handleDeleteConversation = async (id) => {
        try {
            await conversationsApi.deleteConversation(id);
            setConversations(prev => prev.filter(c => c.id !== id));
            if (activeConversationId === id) {
                setActiveConversationId(null);
                setMessages([]);
                setSearchParams({});
            }
        } catch (err) {
            setError(err.message || 'Failed to delete conversation');
        }
    };

    const handleRenameConversation = async (id, newTitle) => {
        try {
            const updated = await conversationsApi.updateConversation(id, { title: newTitle });
            setConversations(prev =>
                prev.map(c => (c.id === id ? { ...c, title: updated.title } : c))
            );
        } catch (err) {
            setError(err.message || 'Failed to rename conversation');
        }
    };

    const handleSendMessage = async (content) => {
        let convId = activeConversationId;

        // Auto-create a conversation if none is active
        if (!convId) {
            try {
                const newConv = await conversationsApi.createConversation('New Conversation');
                setConversations(prev => [newConv, ...prev]);
                setActiveConversationId(newConv.id);
                setSearchParams({ c: newConv.id });
                convId = newConv.id;
            } catch (err) {
                setError(err.message || 'Failed to create conversation');
                return;
            }
        }

        const tempId = `temp-${Date.now()}`;
        const userMessage = {
            id: tempId,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsStreaming(true);
        setStreamingContent('');
        setError('');

        try {
            const stream = messagesApi.streamMessage(convId, content);
            for await (const chunk of stream) {
                setStreamingContent(prev => prev + chunk);
            }
            await loadMessages(convId);
        } catch (err) {
            setError(err.message || 'Failed to get response');
        } finally {
            setIsStreaming(false);
            setStreamingContent('');
        }
    };

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in-up"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                <Sidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={handleSelectConversation}
                    onCreate={handleCreateConversation}
                    onDelete={handleDeleteConversation}
                    onRename={handleRenameConversation}
                    loading={loadingConversations}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>

            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-surface-200/80 flex items-center px-4 lg:px-6 bg-white flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 -ml-2 mr-3 text-surface-500 hover:text-surface-800 hover:bg-surface-100 rounded-lg transition-all"
                        aria-label="Open sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-semibold text-surface-800 truncate text-[15px]">
                            {activeConversation ? (activeConversation.title || 'Untitled Conversation') : 'Select a Conversation'}
                        </h1>
                        {activeConversation && (
                            <p className="text-[11px] text-surface-400 mt-0.5">
                                {activeConversation.message_count || 0} messages
                            </p>
                        )}
                    </div>
                    {isStreaming && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-full">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                            <span className="text-[11px] font-medium text-primary-700">Generating</span>
                        </div>
                    )}
                </header>

                {/* Error display */}
                {error && (
                    <div className="bg-red-50 border-b border-red-200/80 px-4 lg:px-6 py-3 flex items-center justify-between animate-slide-in-left">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                        <button
                            onClick={() => setError('')}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
                            aria-label="Dismiss error"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}

                {/* Messages loading state */}
                {loadingMessages && (
                    <div className="flex items-center justify-center py-8">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-surface-200 border-t-primary-500 rounded-full animate-spin"></div>
                            <span className="text-sm text-surface-400">Loading messages...</span>
                        </div>
                    </div>
                )}

                <ChatWindow
                    messages={messages}
                    isStreaming={isStreaming}
                    streamingContent={streamingContent}
                    onSuggestionClick={handleSendMessage}
                />

                <InputBar
                    onSend={handleSendMessage}
                    disabled={isStreaming}
                />
            </main>
        </div>
    );
}
