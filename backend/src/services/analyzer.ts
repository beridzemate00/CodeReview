import { v4 as uuidv4 } from 'uuid';

export interface ReviewComment {
    id: string;
    type: 'bug' | 'security' | 'performance' | 'refactor' | 'style';
    severity: 'high' | 'medium' | 'low';
    line: number;
    message: string;
    suggestion?: string;
    rationale: string;
}

export class StaticAnalyzer {
    analyze(code: string, language: string): ReviewComment[] {
        const comments: ReviewComment[] = [];
        const lines = code.split('\n');

        lines.forEach((lineContent, index) => {
            const line = index + 1;

            // 1. Check for console.log (Refactor/Style)
            if (lineContent.includes('console.log')) {
                comments.push({
                    id: uuidv4(),
                    type: 'style',
                    severity: 'low',
                    line,
                    message: 'Avoid console.log in production code',
                    suggestion: '// remove console.log',
                    rationale: 'Console logs can clutter output and leak sensitive information.'
                });
            }

            // 2. Check for TODOs (Refactor)
            if (lineContent.includes('TODO') || lineContent.includes('FIXME')) {
                comments.push({
                    id: uuidv4(),
                    type: 'refactor',
                    severity: 'low',
                    line,
                    message: 'Pending generic TODO found',
                    rationale: 'Track technical debt in your issue tracker, not in code comments.'
                });
            }

            // 3. Security: eval() check
            if (lineContent.match(/\beval\(/)) {
                comments.push({
                    id: uuidv4(),
                    type: 'security',
                    severity: 'high',
                    line,
                    message: 'Usage of eval() detected',
                    suggestion: 'Review if eval is strictly necessary. It is a major security risk.',
                    rationale: 'eval() executes arbitrary code and is dangerous.'
                });
            }

            // 4. Performance: nested loops (naïve check)
            if (lineContent.match(/^\s*for\s*\(/) && lines[index - 1]?.match(/^\s*for\s*\(/)) {
                comments.push({
                    id: uuidv4(),
                    type: 'performance',
                    severity: 'medium',
                    line,
                    message: 'Nested loops detected',
                    rationale: 'Nested loops can lead to O(n^2) complexity. Consider optimizing.'
                });
            }

            // 5. Bug/Security: Hardcoded secrets (naïve)
            if (lineContent.match(/(password|secret|api_key)\s*=\s*['"][^'"]+['"]/i)) {
                comments.push({
                    id: uuidv4(),
                    type: 'security',
                    severity: 'high',
                    line,
                    message: 'Potential hardcoded secret',
                    suggestion: 'Use environment variables instead.',
                    rationale: 'Hardcoded credentials can be easily exposed in version control.'
                });
            }
        });

        // 6. Complexity: Long function (naïve) -- just checking total length for demo
        if (lines.length > 50) {
            comments.push({
                id: uuidv4(),
                type: 'refactor',
                severity: 'low',
                line: 1,
                message: 'File/Function is too long',
                rationale: 'Large files are harder to maintain. Consider splitting it up.'
            });
        }

        return comments;
    }
}
