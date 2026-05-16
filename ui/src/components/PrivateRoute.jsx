import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare } from 'lucide-react';

export default function PrivateRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white gap-5">
                <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20">
                        <MessageSquare size={24} className="text-white" />
                    </div>
                    <div className="absolute -inset-2 bg-primary-500/20 rounded-3xl animate-pulse"></div>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-surface-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <span className="text-sm text-surface-400 font-medium">Loading...</span>
                </div>
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}
