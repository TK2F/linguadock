import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    hint?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    isOpen,
    title,
    message,
    hint,
    confirmLabel = 'はい',
    cancelLabel = 'キャンセル',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-background border rounded-lg shadow-lg max-w-sm w-full animate-in zoom-in-95 duration-200">
                <div className={`p-4 border-b ${isDanger ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                    <h3 className={`font-bold text-sm ${isDanger ? 'text-destructive' : ''}`}>
                        {isDanger ? '🚨' : '⚠️'} {title}
                    </h3>
                </div>
                <div className="p-4 space-y-3">
                    <p className="text-sm">{message}</p>
                    {hint && (
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            💡 {hint}
                        </p>
                    )}
                </div>
                <div className="p-4 border-t flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={isDanger ? 'destructive' : 'default'}
                        size="sm"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
