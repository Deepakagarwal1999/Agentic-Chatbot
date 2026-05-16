import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, LogOut, Search, X, Settings, Pencil, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({
    conversations,
    activeId,
    onSelect,
    onCreate,
    onDelete,
    onRename,
    loading,
    onClose,
}) {
    const { logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = useRef(null);

    const handleDelete = (e, id) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(id);
    };

    const handleStartRename = (e, conv) => {
        e.stopPropagation();
        e.preventDefault();
        setRenamingId(conv.id);
        setRenameValue(conv.title || '');
    };

    const handleConfirmRename = (e) => {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const trimmed = renameValue.trim();
        if (trimmed && renamingId) {
            onRename(renamingId, trimmed);
        }
        setRenamingId(null);
        setRenameValue('');
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirmRename();
        } else if (e.key === 'Escape') {
            setRenamingId(null);
            setRenameValue('');
        }
    };

    useEffect(() => {
        if (renamingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [renamingId]);

    const filteredConversations = conversations.filter(conv =>
        (conv.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group conversations by date
    const grouped = groupByDate(filteredConversations);

    return (
        <aside className="w-72 bg-surface-900 flex flex-col h-full select-none">
            {/* Header */}
            <div className="p-4 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/30">
                        <MessageSquare size={16} className="text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-white text-base">Chatbot</span>
                        <p className="text-[10px] text-surface-500 font-medium tracking-wide uppercase">AI Assistant</p>
                    </div>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-lg transition-all"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* New conversation button */}
            <div className="px-3 mb-2">
                <button
                    onClick={onCreate}
                    className="w-full flex items-center gap-3 py-2.5 px-4 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-primary-900/30 hover:shadow-lg"
                >
                    <Plus size={16} />
                    New Conversation
                </button>
            </div>

            {/* Search */}
            {conversations.length > 3 && (
                <div className="px-3 mb-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search..."
                            className="w-full pl-9 pr-8 py-2 bg-surface-800/60 border border-surface-700/50 rounded-lg text-sm text-surface-300 placeholder:text-surface-500 focus:outline-none focus:border-primary-500/50 focus:bg-surface-800 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 dark-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center py-12 gap-3">
                        <div className="w-8 h-8 border-2 border-surface-700 border-t-primary-500 rounded-full animate-spin"></div>
                        <span className="text-surface-500 text-xs">Loading conversations...</span>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-14 h-14 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare size={22} className="text-surface-600" />
                        </div>
                        <p className="text-surface-400 text-sm font-medium">
                            {searchQuery ? 'No matches found' : 'No conversations yet'}
                        </p>
                        <p className="text-surface-600 text-xs mt-1">
                            {searchQuery ? 'Try a different search' : 'Start a new conversation above'}
                        </p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([label, convs]) => (
                        <div key={label} className="mb-3">
                            <p className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-3 py-1.5">
                                {label}
                            </p>
                            <div className="space-y-0.5">
                                {convs.map((conv) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => renamingId !== conv.id && onSelect(conv.id)}
                                        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeId === conv.id
                                            ? 'bg-primary-600/15 text-white border border-primary-500/20'
                                            : 'text-surface-400 hover:bg-surface-800/70 hover:text-surface-200 border border-transparent'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${activeId === conv.id ? 'bg-primary-400 shadow-sm shadow-primary-400/50' : 'bg-surface-700 group-hover:bg-surface-500'
                                            }`} />
                                        <div className="flex-1 min-w-0">
                                            {renamingId === conv.id ? (
                                                <input
                                                    ref={renameInputRef}
                                                    type="text"
                                                    value={renameValue}
                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                    onKeyDown={handleRenameKeyDown}
                                                    onBlur={handleConfirmRename}
                                                    className="w-full text-sm font-medium bg-surface-800 border border-primary-500/50 rounded-md px-2 py-0.5 text-white focus:outline-none focus:border-primary-400"
                                                    maxLength={500}
                                                />
                                            ) : (
                                                <>
                                                    <p className="text-sm font-medium truncate leading-tight">
                                                        {conv.title || 'Untitled Conversation'}
                                                    </p>
                                                    <p className="text-[11px] text-surface-500 mt-0.5 leading-tight">
                                                        {conv.message_count || 0} messages
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                        {renamingId === conv.id ? (
                                            <button
                                                onClick={handleConfirmRename}
                                                className="p-1.5 rounded-lg text-primary-400 hover:bg-primary-400/10 transition-all flex-shrink-0"
                                                title="Confirm rename"
                                            >
                                                <Check size={13} />
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                                <button
                                                    onClick={(e) => handleStartRename(e, conv)}
                                                    className="p-1.5 rounded-lg text-surface-600 hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all"
                                                    title="Rename"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, conv.id)}
                                                    className="p-1.5 rounded-lg transition-all text-surface-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-surface-800/60">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 py-2.5 px-4 text-surface-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl text-sm font-medium transition-all"
                >
                    <LogOut size={15} />
                    Log Out
                </button>
            </div>
        </aside>
    );
}

function groupByDate(conversations) {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const conv of conversations) {
        const date = new Date(conv.updated_at || conv.created_at);
        let label;
        if (date >= today) {
            label = 'Today';
        } else if (date >= yesterday) {
            label = 'Yesterday';
        } else if (date >= weekAgo) {
            label = 'This Week';
        } else {
            label = 'Older';
        }
        if (!groups[label]) groups[label] = [];
        groups[label].push(conv);
    }

    return groups;
}
