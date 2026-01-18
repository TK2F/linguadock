import { useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/store/useQuizStore';
import type { TrueFalseQuestion } from '@/types/learning';

interface TrueFalseCardProps {
    question: TrueFalseQuestion;
}

export function TrueFalseCard({ question }: TrueFalseCardProps) {
    const { submitAnswer, showFeedback, lastAnswerCorrect, nextQuestion, speakItem, settings } = useQuizStore();

    // Keyboard handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (showFeedback) {
            if (e.key === 'Enter' || e.key === ' ') {
                nextQuestion();
            }
            return;
        }
        if (e.key === 'o' || e.key === 'O' || e.key === '1') {
            submitAnswer(true);
        } else if (e.key === 'x' || e.key === 'X' || e.key === '2') {
            submitAnswer(false);
        }
    }, [showFeedback, submitAnswer, nextQuestion]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const getButtonStyle = (value: boolean) => {
        if (!showFeedback) {
            return value
                ? 'bg-card hover:bg-green-500/20 hover:border-green-500'
                : 'bg-card hover:bg-red-500/20 hover:border-red-500';
        }
        const isCorrect = question.isTrue === value;
        if (isCorrect) {
            return value ? 'bg-green-500/30 border-green-500' : 'bg-red-500/30 border-red-500';
        }
        return 'bg-muted opacity-50';
    };

    // Handle speak button click
    const handleSpeak = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        speakItem(question.item);
    };

    // Get primary tag for display
    const primaryTag = question.item.tags?.[0] || question.item.lang.toUpperCase();

    return (
        <div className="space-y-3">
            {/* Category badge */}
            <div className="flex justify-center">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
                    【{primaryTag}】
                </span>
            </div>

            {/* Polish text display */}
            <Card className="border-2 border-primary/50">
                <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <div>
                            <p className="text-xl font-bold text-primary">
                                {question.item.text}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {question.item.reading_kana}
                            </p>
                        </div>
                        {settings.audioEnabled && (
                            <button
                                type="button"
                                onClick={handleSpeak}
                                className="p-2 rounded-full hover:bg-primary/20 transition-colors"
                                title="発音を聞く"
                            >
                                🔊
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Statement */}
            <p className="text-center text-sm text-muted-foreground">
                {question.statement}
            </p>

            {/* True/False buttons */}
            <div className="grid grid-cols-2 gap-3">
                {/* True button */}
                <Card
                    className={`border-2 cursor-pointer transition-all ${getButtonStyle(true)}`}
                    onClick={() => !showFeedback && submitAnswer(true)}
                >
                    <CardContent className="p-4 text-center">
                        <span className="text-2xl">⭕</span>
                        <p className="text-sm font-medium mt-1">正しい</p>
                        <p className="text-[10px] text-muted-foreground">O / 1</p>
                    </CardContent>
                </Card>

                {/* False button */}
                <Card
                    className={`border-2 cursor-pointer transition-all ${getButtonStyle(false)}`}
                    onClick={() => !showFeedback && submitAnswer(false)}
                >
                    <CardContent className="p-4 text-center">
                        <span className="text-2xl">❌</span>
                        <p className="text-sm font-medium mt-1">間違い</p>
                        <p className="text-[10px] text-muted-foreground">X / 2</p>
                    </CardContent>
                </Card>
            </div>

            {/* Feedback */}
            {showFeedback && (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <div className={`text-center p-3 rounded-lg ${lastAnswerCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                        <p className="font-bold text-lg">
                            {lastAnswerCorrect ? '⭕ 正解！' : '❌ 不正解'}
                        </p>
                        <p className="text-sm mt-1">
                            「{question.item.text}」= {question.item.meaning_ja}
                        </p>
                    </div>

                    <Button
                        onClick={nextQuestion}
                        className="w-full"
                        size="sm"
                    >
                        次へ (Enter)
                    </Button>
                </div>
            )}
        </div>
    );
}
