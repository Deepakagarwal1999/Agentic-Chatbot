import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import * as conversationsApi from '../api/conversations';
import * as messagesApi from '../api/messages';
import { Menu, X } from 'lucide-react';

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
        <div className="flex h-screen bg-white">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
                    loading={loadingConversations}
                />
            </div>

            <main className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 border-b border-surface-200 flex items-center px-4 lg:px-6 bg-white/80 backdrop-blur-sm flex-shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 -ml-2 mr-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-all"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-semibold text-surface-800 truncate">
                            {activeConversation ? (activeConversation.title || 'Untitled Conversation') : 'Select a Conversation'}
                        </h1>
                        {activeConversation && (
                            <p className="text-xs text-surface-400">
                                {activeConversation.message_count || 0} messages
                            </p>
                        )}
                    </div>
                </header>

                {/* Error display */}
                {error && (
                    <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-400 hover:text-red-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
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
