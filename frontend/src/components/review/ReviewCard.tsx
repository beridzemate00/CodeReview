import { Bug, Zap, Shield, Sparkles } from 'lucide-react';

interface ReviewComment {
    id: string;
    type: 'bug' | 'security' | 'performance' | 'refactor' | 'style';
    severity: 'high' | 'medium' | 'low';
    line: number;
    message: string;
    suggestion: string;
    rationale: string;
}

interface ReviewCardProps {
    review: ReviewComment;
}

const severityColors = {
    high: 'border-red-500/50 bg-red-500/10 text-red-200',
    medium: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    low: 'border-blue-500/50 bg-blue-500/10 text-blue-200',
};

const typeIcons = {
    bug: <Bug size={16} />,
    security: <Shield size={16} />,
    performance: <Zap size={16} />,
    refactor: <Sparkles size={16} />,
    style: <Sparkles size={16} />, // use sparkles for now
};

export function ReviewCard({ review }: ReviewCardProps) {
    return (
        <div className={`p-4 rounded-lg border ${severityColors[review.severity]} mb-4 transition-all hover:scale-[1.01]`}>
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-md bg-[#0a0a0a]/50">
                        {typeIcons[review.type]}
                    </div>
                    <span className="font-semibold text-sm uppercase tracking-wider opacity-80">{review.type}</span>
                </div>
                <span className="text-xs font-mono bg-[#0a0a0a]/50 px-2 py-1 rounded">Line {review.line}</span>
            </div>

            <h4 className="font-medium text-lg mb-2">{review.message}</h4>
            <p className="text-sm opacity-80 mb-3">{review.rationale}</p>

            {review.suggestion && (
                <div className="bg-[#0a0a0a]/50 p-3 rounded border border-white/10 font-mono text-sm overflow-x-auto">
                    <code>{review.suggestion}</code>
                </div>
            )}
        </div>
    );
}
