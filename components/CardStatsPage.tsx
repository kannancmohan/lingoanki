import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quiz, Priority, Card } from '../types';

interface CardStatsPageProps {
  quiz: Quiz;
  onBack: () => void;
}

const STORAGE_KEY_PREFIX = 'lingoAnki_colWidths_';

const StatHeader: React.FC<{
    children: React.ReactNode;
    onMouseDown: (e: React.MouseEvent) => void;
}> = ({ children, onMouseDown }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider relative group select-none">
        {children}
        <div
            onMouseDown={onMouseDown}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize"
            style={{ zIndex: 10 }}
        />
    </th>
);


const StatCell: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <td className={`px-4 py-4 whitespace-nowrap text-sm overflow-hidden text-ellipsis ${className}`}>{children}</td>
);

const defaultWidths = {
    index: 5,
    front: 25,
    back: 25,
    priority: 12,
    seen: 8,
    correct: 8,
    incorrect: 8,
    correctness: 9,
};

type ColumnKeys = keyof typeof defaultWidths;

const priorityOrder: Record<Priority, number> = {
  [Priority.High]: 1,
  [Priority.Medium]: 2,
  [Priority.Low]: 3,
  [Priority.Unset]: 4,
};

const PriorityPill: React.FC<{ priority: Priority }> = ({ priority }) => {
    const styles: Record<Priority, string> = {
        [Priority.High]: 'bg-red-500/20 text-red-300 border-red-500/30',
        [Priority.Medium]: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        [Priority.Low]: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        [Priority.Unset]: 'bg-slate-600/20 text-slate-400 border-slate-500/30',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[priority]}`}>
            {priority}
        </span>
    );
};

export const CardStatsPage: React.FC<CardStatsPageProps> = ({ quiz, onBack }) => {

    const getInitialWidths = useCallback(() => {
        try {
            const storedWidths = localStorage.getItem(`${STORAGE_KEY_PREFIX}${quiz.id}`);
            if (storedWidths) {
                const parsed = JSON.parse(storedWidths);
                return { ...defaultWidths, ...parsed };
            }
        } catch (error) {
            console.error("Failed to parse column widths from localStorage", error);
        }
        return defaultWidths;
    }, [quiz.id]);

    const [columnWidths, setColumnWidths] = useState<Record<ColumnKeys, number>>(getInitialWidths());
    
    const tableRef = useRef<HTMLTableElement>(null);
    const resizingColumn = useRef<ColumnKeys | null>(null);
    const startX = useRef(0);
    const startWidth = useRef(0);
    
    useEffect(() => {
        try {
            localStorage.setItem(`${STORAGE_KEY_PREFIX}${quiz.id}`, JSON.stringify(columnWidths));
        } catch (error) {
            console.error("Failed to save column widths to localStorage", error);
        }
    }, [columnWidths, quiz.id]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingColumn.current || !tableRef.current) return;

        const tableWidth = tableRef.current.offsetWidth;
        const dx = e.clientX - startX.current;
        const newWidthPx = startWidth.current + dx;
        
        let newWidthPercent = (newWidthPx / tableWidth) * 100;
        newWidthPercent = Math.max(5, Math.min(60, newWidthPercent));

        setColumnWidths(prev => ({
            ...prev,
            [resizingColumn.current!]: newWidthPercent
        }));
    }, []);

    const handleMouseUp = useCallback(() => {
        resizingColumn.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
        if (tableRef.current) {
            tableRef.current.style.userSelect = 'auto';
        }
    }, [handleMouseMove]);

    const handleMouseDown = (e: React.MouseEvent, column: ColumnKeys) => {
        resizingColumn.current = column;
        startX.current = e.clientX;
        
        const headerElement = (e.target as HTMLElement).parentElement as HTMLElement;
        startWidth.current = headerElement.offsetWidth;
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        document.body.style.cursor = 'col-resize';
        if (tableRef.current) {
            tableRef.current.style.userSelect = 'none';
        }
    };

    const sortedCards = [...quiz.cards].sort((a, b) => {
        const priorityComparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityComparison !== 0) {
            return priorityComparison;
        }
        
        const correctnessA = a.timesSeen > 0 ? (a.timesCorrect / a.timesSeen) : -1;
        const correctnessB = b.timesSeen > 0 ? (b.timesCorrect / b.timesSeen) : -1;
        
        if (correctnessA !== correctnessB) {
            return correctnessA - correctnessB; // Sort by lowest correctness first
        }
        
        return b.timesSeen - a.timesSeen; // Then by most seen
    });

    const columns: { key: ColumnKeys; label: string }[] = [
        { key: 'index', label: '#' },
        { key: 'front', label: 'Front' },
        { key: 'back', label: 'Back' },
        { key: 'priority', label: 'Priority' },
        { key: 'seen', label: 'Seen' },
        { key: 'correct', label: 'Correct' },
        { key: 'incorrect', label: 'Incorrect' },
        { key: 'correctness', label: 'Correct %' },
    ];

    return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">&larr; Back to Quizzes</button>
        </div>
      
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white">Card Statistics</h1>
                <p className="text-slate-400 mt-1">Quiz: <span className="font-semibold text-slate-300">{quiz.name}</span></p>
            </div>
            
            <div className="overflow-x-auto">
                <table ref={tableRef} className="min-w-full divide-y divide-slate-700" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <colgroup>
                        {columns.map(col => (
                            <col key={col.key} style={{ width: `${columnWidths[col.key]}%` }} />
                        ))}
                    </colgroup>
                    <thead className="bg-slate-700/50">
                        <tr>
                           {columns.map(col => (
                                <StatHeader key={col.key} onMouseDown={(e) => handleMouseDown(e, col.key)}>
                                    {col.label}
                                </StatHeader>
                           ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {sortedCards.map((card, index) => {
                            const correctness = card.timesSeen > 0 ? Math.round((card.timesCorrect / card.timesSeen) * 100) : 0;
                            let correctnessColor = 'text-slate-300';
                            if(card.timesSeen > 0) {
                                if (correctness >= 90) correctnessColor = 'text-green-400';
                                else if (correctness >= 70) correctnessColor = 'text-yellow-400';
                                else correctnessColor = 'text-red-400';
                            }

                            return (
                                <tr key={card.id} className="hover:bg-slate-700/30">
                                    <StatCell className="text-slate-500">{index + 1}</StatCell>
                                    <StatCell className="text-white font-medium">{card.front}</StatCell>
                                    <StatCell className="text-slate-300">{card.back}</StatCell>
                                    <StatCell><PriorityPill priority={card.priority} /></StatCell>
                                    <StatCell className="text-slate-300">{card.timesSeen}</StatCell>
                                    <StatCell className="text-green-400">{card.timesCorrect}</StatCell>
                                    <StatCell className="text-red-400">{card.timesIncorrect}</StatCell>
                                    <StatCell className={`font-bold ${correctnessColor}`}>
                                        {card.timesSeen > 0 ? `${correctness}%` : 'N/A'}
                                    </StatCell>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
             {quiz.cards.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-slate-400">This quiz has no cards to show statistics for.</p>
                </div>
            )}
        </div>
    </div>
  );
};