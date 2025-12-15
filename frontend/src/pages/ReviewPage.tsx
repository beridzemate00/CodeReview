import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Clipboard, FileText } from 'lucide-react';
import { ReviewCard } from '../components/review/ReviewCard';

export function ReviewPage() {
    const [code, setCode] = useState('// Paste your code here to review...\n\nfunction calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}');
    const [isReviewing, setIsReviewing] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);

    const handleReview = async () => {
        setIsReviewing(true);
        setReviews([]); // clear previous
        try {
            const response = await fetch('http://localhost:3000/api/review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code, language: 'typescript' }),
            });
            const data = await response.json();
            setReviews(data.reviews || []);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
            // Handle error UI here ideally
        } finally {
            setIsReviewing(false);
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6">

            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Code Review</h1>
                    <p className="text-neutral-400 mt-1">Paste your code or diff below to get instant AI feedback.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800 transition-colors text-neutral-300 font-medium text-sm">
                        <Clipboard size={16} />
                        <span>Paste from Clipboard</span>
                    </button>
                    <button
                        onClick={handleReview}
                        disabled={isReviewing}
                        className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all text-white font-medium text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isReviewing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Analyzing...</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>Start Review</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content Split View */}
            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0">

                {/* Editor Section */}
                <div className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-neutral-800 flex flex-col shadow-2xl">
                    <div className="bg-[#252526] px-4 py-2 border-b border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></span>
                            <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></span>
                            <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></span>
                        </div>
                        <span className="text-xs text-neutral-500 font-mono">input.ts</span>
                    </div>
                    <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        theme="vs-dark"
                        value={code}
                        onChange={(value) => setCode(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            padding: { top: 20 },
                            scrollBeyondLastLine: false,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        }}
                    />
                </div>

                {/* Results Section (Placeholder) */}
                <div className="bg-[#0F0F0F] rounded-xl border border-neutral-800 flex flex-col p-6 overflow-y-auto">
                    {!isReviewing && reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-neutral-800/50 flex items-center justify-center mb-2">
                                <FileText size={32} className="text-neutral-600" />
                            </div>
                            <h3 className="text-lg font-medium text-white">Ready to Review</h3>
                            <p className="text-neutral-500 max-w-sm">
                                Your code analysis will appear here. We'll check for bugs, security vulnerabilities, and logic improvements.
                            </p>
                        </div>
                    ) : isReviewing ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-4 bg-neutral-800 rounded w-3/4"></div>
                            <div className="h-4 bg-neutral-800 rounded w-1/2"></div>
                            <div className="h-24 bg-neutral-800 rounded w-full mt-6"></div>
                            <div className="h-24 bg-neutral-800 rounded w-full"></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold mb-4 flex items-center">
                                <span className="bg-blue-600 px-2 py-1 rounded text-xs mr-2">{reviews.length} Issues Found</span>
                            </h3>
                            {reviews.map((review) => (
                                <ReviewCard key={review.id} review={review} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
