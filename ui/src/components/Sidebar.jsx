import { useState } from 'react';
import { Plus, Trash2, MessageSquare, LogOut, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({
    conversations,
    activeId,
    onSelect,
    onCreate,
    onDelete,
    loading,
}) {
    const { logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    const handleDelete = (e, id) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(id);
    };

    const filteredConversations = conversations.filter(conv =>
        (conv.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <aside className="w-72 bg-surface-900 flex flex-col h-full">
            {/* Header */}
            <div className="p-5 flex items-center gap-3">
                <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                    <MessageSquare size={16} className="text-white" />
                </div>
                <span className="font-bold text-white text-lg">Chatbot</span>
            </div>

            {/* New conversation button */}
            <div className="px-4 mb-3">
                <button
                    onClick={onCreate}
                    className="w-full flex items-center gap-3 py-3 px-4 bg-surface-800 hover:bg-surface-700 text-white text-sm font-medium rounded-xl transition-all border border-surface-700 hover:border-surface-600"
                >
                    <Plus size={18} className="text-primary-400" />
                    New Conversation
                </button>
            </div>

            {/* Search */}
            {conversations.length > 3 && (
                <div className="px-4 mb-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full pl-9 pr-3 py-2 bg-surface-800 border border-surface-700 rounded-lg text-sm text-surface-300 placeholder:text-surface-500 focus:outline-none focus:border-surface-500 transition-all"
                        />
                    </div>
                </div>
            )}

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-3 space-y-0.5 dark-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center py-8 gap-3">
                        <div className="w-6 h-6 border-2 border-surface-600 border-t-primary-500 rounded-full animate-spin"></div>
                        <span className="text-surface-500 text-xs">Loading...</span>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-surface-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                            <MessageSquare size={20} className="text-surface-600" />
                        </div>
                        <p className="text-surface-500 text-sm">
                            {searchQuery ? 'No matches found' : 'No conversations yet'}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeId === conv.id
                                ? 'bg-surface-700/80 text-white'
                                : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
                                }`}
                        >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activeId === conv.id ? 'bg-primary-500' : 'bg-transparent'
                                }`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    {conv.title || 'Untitled Conversation'}
                                </p>
                                <p className="text-xs text-surface-500 mt-0.5">
                                    {conv.message_count || 0} messages
                                </p>
                            </div>
                            <button
                                onClick={(e) => handleDelete(e, conv.id)}
                                className="p-1.5 rounded-lg transition-all flex-shrink-0 text-surface-600 hover:text-red-400 opacity-60 hover:opacity-100"
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-800">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 py-2.5 px-4 text-surface-400 hover:text-white hover:bg-surface-800 rounded-xl text-sm font-medium transition-all"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </aside>
    );
}
