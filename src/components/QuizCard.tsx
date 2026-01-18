import { useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuizStore } from '@/store/useQuizStore';
import type { ChoiceQuestion, LearningItem } from '@/types/learning';

interface QuizCardProps {
    question: ChoiceQuestion;
}

export function QuizCard({ question }: QuizCardProps) {
    const { submitAnswer, showFeedback, lastAnswerCorrect, nextQuestion, speakItem, settings } = useQuizStore();

    // Keyboard handler
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (showFeedback) {
            if (e.key === 'Enter' || e.key === ' ') {
                nextQuestion();
            }
            return;
        }
        if (e.key === '1') {
            submitAnswer('A');
        } else if (e.key === '2') {
            submitAnswer('B');
        }
    }, [showFeedback, submitAnswer, nextQuestion]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const getOptionStyle = (option: 'A' | 'B') => {
        if (!showFeedback) {
            return 'bg-card hover:bg-accent hover:border-primary cursor-pointer transition-all duration-200';
        }
        const isCorrect = question.correctAnswer === option;
        if (isCorrect) {
            return 'bg-green-500/20 border-green-500';
        }
        if (!lastAnswerCorrect) {
            return 'bg-red-500/20 border-red-500';
        }
        return 'bg-muted opacity-50';
    };

    // Handle speak button click
    const handleSpeak = (e: MouseEvent<HTMLButtonElement>, item: LearningItem) => {
        e.preventDefault();
        e.stopPropagation();
        speakItem(item);
    };

    // Handle card click for answer selection
    const handleCardClick = (answer: 'A' | 'B') => {
        if (!showFeedback) {
            submitAnswer(answer);
        }
    };

    // Get primary tag for display
    const primaryTag = question.optionA.tags?.[0] || question.optionA.lang.toUpperCase();

    return (
        <div className="space-y-3">
            {/* Category badge */}
            <div className="flex justify-center">
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    【{primaryTag}】
                </span>
            </div>

            {/* Question prompt */}
            <p className="text-center text-base font-medium text-foreground">
                {question.prompt}
            </p>

            {/* Options */}
            <div className="space-y-2">
                {/* Option A */}
                <Card
                    className={`border-2 ${getOptionStyle('A')}`}
                    onClick={() => handleCardClick('A')}
                >
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                1
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-foreground truncate">
                                    {question.optionA.text}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {question.optionA.reading_kana}
                                </p>
                            </div>
                            {settings.audioEnabled && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSpeak(e, question.optionA)}
                                    className="flex-shrink-0 p-2 rounded-full hover:bg-primary/20 transition-colors"
                                    title="発音を聞く"
                                >
                                    🔊
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Option B */}
                <Card
                    className={`border-2 ${getOptionStyle('B')}`}
                    onClick={() => handleCardClick('B')}
                >
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                2
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-foreground truncate">
                                    {question.optionB.text}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {question.optionB.reading_kana}
                                </p>
                            </div>
                            {settings.audioEnabled && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSpeak(e, question.optionB)}
                                    className="flex-shrink-0 p-2 rounded-full hover:bg-primary/20 transition-colors"
                                    title="発音を聞く"
                                >
                                    🔊
                                </button>
                            )}
                        </div>
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
                        {!lastAnswerCorrect && (
                            <p className="text-sm mt-1">
                                正解: {question.correctAnswer === 'A'
                                    ? question.optionA.text
                                    : question.optionB.text}
                            </p>
                        )}
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
