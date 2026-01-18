import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BUILT_IN_DATASETS } from '@/lib/builtInDataSets';

interface WelcomePopupProps {
    onClose: () => void;
}

export function WelcomePopup({ onClose }: WelcomePopupProps) {
    const [isVisible, setIsVisible] = useState(true);

    const handleClose = () => {
        setIsVisible(false);
        onClose();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full max-h-[90vh] overflow-auto animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pb-2">
                    <h2 className="text-2xl font-bold">🌐 LinguaDock へようこそ！</h2>
                    <p className="text-sm text-muted-foreground">
                        多言語学習をサポートするChrome拡張機能
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 同梱データセット一覧 */}
                    <div>
                        <h3 className="font-semibold mb-2 text-sm">📦 同梱データセット</h3>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                            {BUILT_IN_DATASETS.map(ds => (
                                <div key={ds.id} className="flex items-center gap-1">
                                    <span>{ds.emoji}</span>
                                    <span className="truncate">{ds.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 機能説明 */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                        <h3 className="font-semibold">📝 このツールでできること</h3>
                        <ul className="space-y-1 text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="shrink-0">✓</span>
                                <span>同梱CSVはいつでもアンロード／再ロード可能</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0">✓</span>
                                <span>他の言語に自由に切り替え</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0">✓</span>
                                <span>自作CSVでパーソナライズ学習</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0">✓</span>
                                <span>データセットごとにロック／アンロック設定</span>
                            </li>
                        </ul>
                    </div>

                    {/* 初回ロードされるデータセット */}
                    <div className="bg-primary/10 rounded-lg p-3 text-sm">
                        <p className="font-semibold mb-1">🚀 初回ロード済み</p>
                        <div className="flex gap-2 text-xs">
                            {BUILT_IN_DATASETS.filter(ds => ds.defaultLoaded).map(ds => (
                                <span key={ds.id} className="bg-primary/20 px-2 py-1 rounded">
                                    {ds.emoji} {ds.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* 始めるボタン */}
                    <Button onClick={handleClose} className="w-full">
                        始める
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
