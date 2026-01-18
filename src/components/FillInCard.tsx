import { useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/store/useQuizStore';
import type { FillInQuestion } from '@/types/learning';

interface FillInCardProps {
    question: FillInQuestion;
}

export function FillInCard({ question }: FillInCardProps) {
    const { submitAnswer, showFeedback, lastAnswerCorrect, nextQuestion, speakItem, settings } = useQuizStore();

    const optionA = question.correctAnswer === 'A' ? question.correctPart : question.wrongPart;
    const optionB = question.correctAnswer === 'B' ? question.correctPart : question.wrongPart;

    const handleSelect = useCallback((answer: 'A' | 'B') => {
        if (!showFeedback) {
            submitAnswer(answer);
        }
    }, [showFeedback, submitAnswer]);

    const handleSpeak = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        speakItem(question.item);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showFeedback) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nextQuestion();
                }
                return;
            }

            switch (e.key) {
                case '1':
                case 'a':
                case 'A':
                case 'ArrowLeft':
                    handleSelect('A');
                    break;
                case '2':
                case 'b':
                case 'B':
                case 'ArrowRight':
                    handleSelect('B');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showFeedback, handleSelect, nextQuestion]);

    const getCardStyle = (option: 'A' | 'B') => {
        if (!showFeedback) {
            return 'hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-200';
        }
        const isCorrect = option === question.correctAnswer;
        if (isCorrect) {
            return 'border-green-500 bg-green-50 dark:bg-green-950/30';
        }
        return 'border-red-500 bg-red-50 dark:bg-red-950/30 opacity-60';
    };

    // Get primary tag for display
    const primaryTag = question.item.tags?.[0] || question.item.lang.toUpperCase();

    return (
        <div className="space-y-3">
            {/* Prompt: masked text */}
            <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
                <CardContent className="py-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">
                        空欄に入る単語は？【{primaryTag}】
                    </p>
                    <p className="text-xl font-bold text-primary">{question.maskedText}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        意味: {question.item.meaning_ja}
                    </p>
                    {settings.audioEnabled && (
                        <button
                            onClick={handleSpeak}
                            className="mt-2 p-2 rounded-full hover:bg-primary/20 transition-colors"
                            title="発音を聞く"
                        >
                            🔊
                        </button>
                    )}
                </CardContent>
            </Card>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2">
                {/* Option A */}
                <Card
                    className={`${getCardStyle('A')} border-2`}
                    onClick={() => handleSelect('A')}
                >
                    <CardContent className="p-3 text-center">
                        <span className="text-lg font-bold text-primary">{optionA}</span>
                        <p className="text-[10px] text-muted-foreground mt-1">1 / A / ←</p>
                    </CardContent>
                </Card>

                {/* Option B */}
                <Card
                    className={`${getCardStyle('B')} border-2`}
                    onClick={() => handleSelect('B')}
                >
                    <CardContent className="p-3 text-center">
                        <span className="text-lg font-bold text-primary">{optionB}</span>
                        <p className="text-[10px] text-muted-foreground mt-1">2 / B / →</p>
                    </CardContent>
                </Card>
            </div>

            {/* Feedback & Next */}
            {showFeedback && (
                <div className="space-y-2 animate-in fade-in duration-300">
                    <div className={`text-center p-2 rounded-lg ${lastAnswerCorrect
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                        }`}>
                        <p className="font-bold text-lg">
                            {lastAnswerCorrect ? '⭕ 正解！' : '❌ 不正解'}
                        </p>
                        <p className="text-sm">
                            正解: <span className="font-bold">{question.item.text}</span>
                        </p>
                        <p className="text-xs">（{question.item.reading_kana}）</p>
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
