/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

let toastId = 0;
const toastListeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: Toast['type'] = 'info') {
    const toast: Toast = {
        id: `toast-${++toastId}`,
        message,
        type,
    };
    toastListeners.forEach(listener => listener(toast));
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const listener = (toast: Toast) => {
            setToasts(prev => [...prev, toast]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toast.id));
            }, 3000);
        };
        toastListeners.add(listener);
        return () => {
            toastListeners.delete(listener);
        };
    }, []);

    const typeStyles = {
        success: 'bg-green-500 text-white',
        error: 'bg-destructive text-destructive-foreground',
        warning: 'bg-yellow-500 text-black',
        info: 'bg-primary text-primary-foreground',
    };

    const typeEmojis = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[200] space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${typeStyles[toast.type]}`}
                >
                    <span className="mr-2">{typeEmojis[toast.type]}</span>
                    {toast.message}
                </div>
            ))}
        </div>
    );
}
