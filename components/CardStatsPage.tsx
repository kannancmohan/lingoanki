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
    isSortable?: boolean;
    isSorted?: boolean;
    sortDirection?: 'asc' | 'desc';
    onSort?: () => void;
}> = ({ children, onMouseDown, isSortable, isSorted, sortDirection, onSort }) => (
    <th 
        onClick={isSortable ? onSort : undefined}
        className={`px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider relative group select-none ${isSortable ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
    >
        <div className="flex items-center space-x-1">
            <span>{children}</span>
            {isSortable && (
                <span className="inline-flex text-xs leading-none">
                    {isSorted ? (
                        sortDirection === 'asc' ? (
                            <span className="text-sky-400 font-bold">▲</span>
                        ) : (
                            <span className="text-sky-400 font-bold">▼</span>
                        )
                    ) : (
                        <span className="text-slate-600 group-hover:text-slate-400 opacity-60">↕</span>
                    )}
                </span>
            )}
        </div>
        <div
            onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e);
            }}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize"
            style={{ zIndex: 10 }}
        />
    </th>
);


const StatCell: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <td className={`px-3 py-4 whitespace-nowrap text-sm overflow-hidden text-ellipsis ${className}`}>{children}</td>
);

const defaultWidths = {
    index: 8,
    front: 23,
    back: 23,
    priority: 12,
    seen: 8,
    correct: 8,
    incorrect: 8,
    correctness: 10,
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
                const merged = { ...defaultWidths, ...parsed };
                if (merged.index < 8) {
                    merged.index = 8;
                }
                return merged;
            }
        } catch (error) {
            console.error("Failed to parse column widths from localStorage", error);
        }
        return defaultWidths;
    }, [quiz.id]);

    const [columnWidths, setColumnWidths] = useState<Record<ColumnKeys, number>>(getInitialWidths());
    const [sortField, setSortField] = useState<ColumnKeys>('priority');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
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

    const cardsWithOriginalIndex = React.useMemo(() => {
        return quiz.cards.map((card, idx) => ({
            ...card,
            originalIndex: idx + 1,
        }));
    }, [quiz.cards]);

    const handleSort = (field: ColumnKeys) => {
        if (field === 'front' || field === 'back') return;
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedCards = React.useMemo(() => {
        return [...cardsWithOriginalIndex].sort((a, b) => {
            let comp = 0;
            if (sortField === 'index') {
                comp = a.originalIndex - b.originalIndex;
            } else if (sortField === 'priority') {
                comp = priorityOrder[a.priority] - priorityOrder[b.priority];
                if (comp === 0) {
                    const correctnessA = a.timesSeen > 0 ? (a.timesCorrect / a.timesSeen) : -1;
                    const correctnessB = b.timesSeen > 0 ? (b.timesCorrect / b.timesSeen) : -1;
                    if (correctnessA !== correctnessB) {
                        comp = correctnessA - correctnessB;
                    } else {
                        comp = b.timesSeen - a.timesSeen;
                    }
                }
            } else if (sortField === 'seen') {
                comp = a.timesSeen - b.timesSeen;
            } else if (sortField === 'correct') {
                comp = a.timesCorrect - b.timesCorrect;
            } else if (sortField === 'incorrect') {
                comp = a.timesIncorrect - b.timesIncorrect;
            } else if (sortField === 'correctness') {
                const correctnessA = a.timesSeen > 0 ? (a.timesCorrect / a.timesSeen) : -1;
                const correctnessB = b.timesSeen > 0 ? (b.timesCorrect / b.timesSeen) : -1;
                comp = correctnessA - correctnessB;
            }

            if (comp === 0) {
                comp = a.originalIndex - b.originalIndex;
            }

            return sortDirection === 'asc' ? comp : -comp;
        });
    }, [cardsWithOriginalIndex, sortField, sortDirection]);

    const columns: { key: ColumnKeys; label: string; sortable: boolean }[] = [
        { key: 'index', label: '#', sortable: true },
        { key: 'front', label: 'Front', sortable: false },
        { key: 'back', label: 'Back', sortable: false },
        { key: 'priority', label: 'Priority', sortable: true },
        { key: 'seen', label: 'Seen', sortable: true },
        { key: 'correct', label: 'Correct', sortable: true },
        { key: 'incorrect', label: 'Incorrect', sortable: true },
        { key: 'correctness', label: 'Correct %', sortable: true },
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
                                <StatHeader 
                                    key={col.key} 
                                    onMouseDown={(e) => handleMouseDown(e, col.key)}
                                    isSortable={col.sortable}
                                    isSorted={sortField === col.key}
                                    sortDirection={sortDirection}
                                    onSort={() => handleSort(col.key)}
                                >
                                    {col.label}
                                </StatHeader>
                           ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {sortedCards.map((card) => {
                            const correctness = card.timesSeen > 0 ? Math.round((card.timesCorrect / card.timesSeen) * 100) : 0;
                            let correctnessColor = 'text-slate-300';
                            if(card.timesSeen > 0) {
                                if (correctness >= 90) correctnessColor = 'text-green-400';
                                else if (correctness >= 70) correctnessColor = 'text-yellow-400';
                                else correctnessColor = 'text-red-400';
                            }

                            return (
                                <tr key={card.id} className="hover:bg-slate-700/30">
                                    <StatCell className="text-slate-500">{card.originalIndex}</StatCell>
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