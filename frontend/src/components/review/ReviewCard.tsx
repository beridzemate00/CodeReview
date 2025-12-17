import React from 'react';
import { AlertTriangle, Info, CheckCircle, Lightbulb, Code, ChevronDown, ChevronUp } from 'lucide-react';

interface Review {
    id?: string;
    message: string;
    severity: 'high' | 'medium' | 'low' | 'info';
    line: number;
    type: string;
    suggestion?: string;
    code?: string;
    source?: string;
    fileName?: string;
}

interface ReviewCardProps {
    review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
    const [expanded, setExpanded] = React.useState(false);

    const getSeverityConfig = (severity: string) => {
        switch (severity) {
            case 'high':
                return {
                    icon: <AlertTriangle size={16} />,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30',
                    badge: 'bg-red-500 text-white',
                    label: 'High'
                };
            case 'medium':
                return {
                    icon: <Info size={16} />,
                    color: 'text-yellow-500',
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30',
                    badge: 'bg-yellow-500 text-black',
                    label: 'Medium'
                };
            case 'low':
                return {
                    icon: <CheckCircle size={16} />,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30',
                    badge: 'bg-blue-500 text-white',
                    label: 'Low'
                };
            default:
                return {
                    icon: <Info size={16} />,
                    color: 'text-gray-500',
                    bg: 'bg-gray-500/10',
                    border: 'border-gray-500/30',
                    badge: 'bg-gray-500 text-white',
                    label: 'Info'
                };
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            security: 'Security',
            performance: 'Performance',
            error: 'Error',
            warning: 'Warning',
            style: 'Style',
            best_practice: 'Best Practice',
            code_smell: 'Code Smell',
            bug: 'Bug',
            suggestion: 'Suggestion',
            maintainability: 'Maintainability',
            readability: 'Readability'
        };
        return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const config = getSeverityConfig(review.severity);

    return (
        <div className={`card ${config.bg} ${config.border} p-4 transition-all hover:shadow-md`}>
            <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${config.color}`}>
                    {config.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${config.badge}`}>
                            {config.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded">
                            {getTypeLabel(review.type)}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            Line {review.line}
                        </span>
                        {review.fileName && (
                            <span className="text-xs text-[var(--text-muted)]">
                                in {review.fileName}
                            </span>
                        )}
                        {review.source && (
                            <span className="text-xs text-[var(--text-muted)] opacity-60">
                                via {review.source}
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-[var(--text-primary)] mb-2">{review.message}</p>

                    {review.suggestion && (
                        <div className="flex items-start gap-2 text-sm text-[var(--accent-blue)] bg-[var(--accent-blue)]/5 p-2 rounded-lg">
                            <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{review.suggestion}</span>
                        </div>
                    )}

                    {review.code && (
                        <div className="mt-2">
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <Code size={12} />
                                {expanded ? 'Hide code' : 'Show code'}
                                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                            {expanded && (
                                <pre className="mt-2 p-3 bg-[var(--bg-tertiary)] rounded-lg text-xs text-[var(--text-secondary)] overflow-x-auto">
                                    <code>{review.code}</code>
                                </pre>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
