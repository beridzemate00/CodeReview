import { v4 as uuidv4 } from 'uuid';

export interface ReviewComment {
    id: string;
    type: 'bug' | 'security' | 'performance' | 'refactor' | 'style';
    severity: 'high' | 'medium' | 'low';
    line: number;
    message: string;
    suggestion?: string;
    rationale: string;
    fixCode?: string; // Suggested fix code
}

export interface AnalysisResult {
    reviews: ReviewComment[];
    stats: {
        totalIssues: number;
        highSeverity: number;
        mediumSeverity: number;
        lowSeverity: number;
        qualityScore: number;
        complexity: number;
        linesOfCode: number;
    };
}

// Language-specific patterns
interface LanguagePatterns {
    consoleLog: RegExp;
    debugStatement: RegExp;
    eval: RegExp;
    todoComment: RegExp;
    hardcodedSecret: RegExp;
    emptyBlock: RegExp;
    magicNumber: RegExp;
    looseEquality: RegExp;
    anyType: RegExp;
    longLine: number;
    functionKeywords: RegExp;
    loopKeywords: RegExp;
}

const LANGUAGE_PATTERNS: Record<string, LanguagePatterns> = {
    javascript: {
        consoleLog: /console\.(log|warn|error|info|debug)\s*\(/,
        debugStatement: /\bdebugger\b/,
        eval: /\beval\s*\(/,
        todoComment: /(\/\/|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*[:=]\s*['"`][^'"`]{4,}['"`]/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b(?!\s*[:\]])/,
        looseEquality: /[^!=]==[^=]/,
        anyType: /:\s*any\b/,
        longLine: 120,
        functionKeywords: /\b(function|const\s+\w+\s*=|let\s+\w+\s*=|=>\s*{)/,
        loopKeywords: /\b(for|while|do)\s*\(/,
    },
    typescript: {
        consoleLog: /console\.(log|warn|error|info|debug)\s*\(/,
        debugStatement: /\bdebugger\b/,
        eval: /\beval\s*\(/,
        todoComment: /(\/\/|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*[:=]\s*['"`][^'"`]{4,}['"`]/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b(?!\s*[:\]])/,
        looseEquality: /[^!=]==[^=]/,
        anyType: /:\s*any\b/,
        longLine: 120,
        functionKeywords: /\b(function|const\s+\w+\s*=|let\s+\w+\s*=|=>\s*{)/,
        loopKeywords: /\b(for|while|do)\s*\(/,
    },
    python: {
        consoleLog: /\bprint\s*\(/,
        debugStatement: /\b(pdb\.set_trace|breakpoint)\s*\(/,
        eval: /\b(eval|exec)\s*\(/,
        todoComment: /#\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*=\s*['"][^'"]{4,}['"]/i,
        emptyBlock: /:\s*pass\b/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /\bis\s+not\s+None\b|\bis\s+None\b/,  // Python uses 'is', not ==
        anyType: /:\s*Any\b/,
        longLine: 88,  // PEP 8 standard
        functionKeywords: /\bdef\s+\w+/,
        loopKeywords: /\b(for|while)\s+/,
    },
    java: {
        consoleLog: /System\.out\.print(ln)?\s*\(/,
        debugStatement: /\/\/\s*DEBUG/,
        eval: /\.invoke\s*\(/,  // Reflection can be dangerous
        todoComment: /(\/\/|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*=\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /\.equals\s*\(/,  // null.equals() can NPE
        anyType: /Object\s+\w+\s*[=;]/,
        longLine: 120,
        functionKeywords: /(public|private|protected)\s+(static\s+)?[\w<>\[\]]+\s+\w+\s*\(/,
        loopKeywords: /\b(for|while|do)\s*\(/,
    },
    cpp: {
        consoleLog: /(std::)?cout\s*<</,
        debugStatement: /#ifdef\s+DEBUG/,
        eval: /system\s*\(/,
        todoComment: /(\/\/|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*=\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /==\s*NULL\b/,
        anyType: /void\s*\*/,
        longLine: 120,
        functionKeywords: /[\w<>*&]+\s+\w+\s*\([^)]*\)\s*{/,
        loopKeywords: /\b(for|while|do)\s*\(/,
    },
    go: {
        consoleLog: /fmt\.Print(ln|f)?\s*\(/,
        debugStatement: /\/\/\s*DEBUG/,
        eval: /reflect\.Value/,
        todoComment: /\/\/\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*[:=]\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /==\s*nil\b/,
        anyType: /interface\{\}/,
        longLine: 100,
        functionKeywords: /func\s+(\(\w+\s+\*?\w+\)\s+)?\w+\s*\(/,
        loopKeywords: /\bfor\s+/,
    },
    rust: {
        consoleLog: /(println|print|eprintln|eprint)!\s*\(/,
        debugStatement: /dbg!\s*\(/,
        eval: /unsafe\s*{/,
        todoComment: /\/\/\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*[:=]\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /\.unwrap\(\)/,
        anyType: /dyn\s+Any/,
        longLine: 100,
        functionKeywords: /fn\s+\w+/,
        loopKeywords: /\b(for|while|loop)\s+/,
    },
    ruby: {
        consoleLog: /\bputs\b|\bprint\b|\bp\b\s+/,
        debugStatement: /\bbinding\.pry\b|\bbyebug\b/,
        eval: /\beval\s*\(/,
        todoComment: /#\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*=\s*['"][^'"]{4,}['"]/i,
        emptyBlock: /do\s*end/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /==\s*nil\b/,
        anyType: /Object/,
        longLine: 100,
        functionKeywords: /def\s+\w+/,
        loopKeywords: /\b(for|while|until|each)\b/,
    },
    php: {
        consoleLog: /\b(echo|print|var_dump|print_r)\s*[\(;]/,
        debugStatement: /\bdd\s*\(|\bdie\s*\(/,
        eval: /\beval\s*\(/,
        todoComment: /(\/\/|#|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /\$(password|secret|api_key|apikey|token|auth)\s*=\s*['"][^'"]{4,}['"]/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_$])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /[^!=]==[^=]/,
        anyType: /mixed\s+\$/,
        longLine: 120,
        functionKeywords: /function\s+\w+/,
        loopKeywords: /\b(for|foreach|while|do)\s*\(/,
    },
    csharp: {
        consoleLog: /Console\.Write(Line)?\s*\(/,
        debugStatement: /Debug\.Write(Line)?\s*\(/,
        eval: /Activator\.CreateInstance/,
        todoComment: /(\/\/|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*=\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /==\s*null\b/,
        anyType: /\bobject\s+\w+/,
        longLine: 120,
        functionKeywords: /(public|private|protected|internal)\s+(static\s+)?[\w<>\[\]]+\s+\w+\s*\(/,
        loopKeywords: /\b(for|foreach|while|do)\s*\(/,
    },
    swift: {
        consoleLog: /print\s*\(/,
        debugStatement: /debugPrint\s*\(/,
        eval: /NSExpression/,
        todoComment: /\/\/\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*[:=]\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /==\s*nil\b/,
        anyType: /:\s*Any\b/,
        longLine: 120,
        functionKeywords: /func\s+\w+/,
        loopKeywords: /\b(for|while|repeat)\s+/,
    },
    kotlin: {
        consoleLog: /println\s*\(/,
        debugStatement: /\/\/\s*DEBUG/,
        eval: /\.invoke\s*\(/,
        todoComment: /(\/\/|\/\*)\s*(TODO|FIXME|HACK|XXX)/i,
        hardcodedSecret: /(password|secret|api_key|apikey|token|auth)\s*=\s*"[^"]{4,}"/i,
        emptyBlock: /\{\s*\}/,
        magicNumber: /(?<![a-zA-Z0-9_.])\b(?!0\b|1\b|2\b|100\b|1000\b)(\d{2,})\b/,
        looseEquality: /==\s*null\b/,
        anyType: /:\s*Any\b/,
        longLine: 120,
        functionKeywords: /fun\s+\w+/,
        loopKeywords: /\b(for|while|do)\s+/,
    },
};

// Default fallback patterns
const DEFAULT_PATTERNS: LanguagePatterns = LANGUAGE_PATTERNS.javascript;

export class StaticAnalyzer {
    private getPatterns(language: string): LanguagePatterns {
        const normalizedLang = language.toLowerCase().replace(/\s+/g, '');
        return LANGUAGE_PATTERNS[normalizedLang] || DEFAULT_PATTERNS;
    }

    analyze(code: string, language: string): AnalysisResult {
        const comments: ReviewComment[] = [];
        const lines = code.split('\n');
        const patterns = this.getPatterns(language);

        let functionCount = 0;
        let branchCount = 0;  // For cyclomatic complexity

        lines.forEach((lineContent, index) => {
            const line = index + 1;

            // Count functions for complexity
            if (patterns.functionKeywords.test(lineContent)) {
                functionCount++;
            }

            // Count branches for complexity
            if (/\b(if|else|switch|case|catch|\?|&&|\|\|)\b/.test(lineContent)) {
                branchCount++;
            }

            // 1. Console/Print statements
            if (patterns.consoleLog.test(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'style',
                    severity: 'low',
                    line,
                    message: 'Debug statement detected',
                    suggestion: 'Remove or use a proper logging framework',
                    rationale: 'Debug statements can clutter output and leak sensitive information in production.',
                    fixCode: this.getConsoleFix(language, lineContent),
                });
            }

            // 2. Debugger statements
            if (patterns.debugStatement.test(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'bug',
                    severity: 'high',
                    line,
                    message: 'Debugger/breakpoint statement found',
                    suggestion: 'Remove debugger statement before deployment',
                    rationale: 'Debugger statements will pause execution in production.',
                    fixCode: '// Removed debugger statement',
                });
            }

            // 3. Eval and dangerous functions
            if (patterns.eval.test(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'security',
                    severity: 'high',
                    line,
                    message: 'Dangerous function usage detected',
                    suggestion: 'Avoid eval/exec. Use safer alternatives like JSON.parse or specific parsers.',
                    rationale: 'These functions can execute arbitrary code and pose security risks.',
                });
            }

            // 4. TODO/FIXME comments
            if (patterns.todoComment.test(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'refactor',
                    severity: 'low',
                    line,
                    message: 'TODO/FIXME comment found',
                    rationale: 'Track technical debt in your issue tracker for better visibility.',
                });
            }

            // 5. Hardcoded secrets
            if (patterns.hardcodedSecret.test(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'security',
                    severity: 'high',
                    line,
                    message: 'Potential hardcoded secret detected',
                    suggestion: 'Use environment variables or a secrets manager.',
                    rationale: 'Hardcoded credentials can be exposed in version control.',
                    fixCode: this.getSecretFix(language),
                });
            }

            // 6. Empty blocks
            if (patterns.emptyBlock.test(lineContent) && !lineContent.includes('{}')) {
                comments.push({
                    id: uuidv4(),
                    type: 'style',
                    severity: 'low',
                    line,
                    message: 'Empty code block detected',
                    rationale: 'Empty blocks may indicate missing logic or can be removed.',
                });
            }

            // 7. Magic numbers
            if (patterns.magicNumber.test(lineContent) && !this.isArrayIndex(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'refactor',
                    severity: 'low',
                    line,
                    message: 'Magic number detected',
                    suggestion: 'Extract magic numbers to named constants for better readability.',
                    rationale: 'Magic numbers make code harder to understand and maintain.',
                    fixCode: this.getMagicNumberFix(language, lineContent),
                });
            }

            // 8. Loose equality (JS/TS specific)
            if (['javascript', 'typescript'].includes(language.toLowerCase())) {
                if (/[^!=]==[^=]/.test(lineContent)) {
                    comments.push({
                        id: uuidv4(),
                        type: 'bug',
                        severity: 'medium',
                        line,
                        message: 'Loose equality (==) used',
                        suggestion: 'Use strict equality (===) instead.',
                        rationale: 'Loose equality can lead to unexpected type coercion.',
                        fixCode: lineContent.replace(/==/g, '==='),
                    });
                }
            }

            // 9. Any type (TypeScript/Python)
            if (patterns.anyType.test(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'style',
                    severity: 'medium',
                    line,
                    message: 'Weak/any type detected',
                    suggestion: 'Use a more specific type for better type safety.',
                    rationale: 'Using any/Any bypasses type checking.',
                });
            }

            // 10. Long lines
            if (lineContent.length > patterns.longLine) {
                comments.push({
                    id: uuidv4(),
                    type: 'style',
                    severity: 'low',
                    line,
                    message: `Line exceeds ${patterns.longLine} characters (${lineContent.length})`,
                    suggestion: 'Break long lines for better readability.',
                    rationale: 'Long lines can be hard to read and may cause horizontal scrolling.',
                });
            }

            // 11. Nested loops detection
            if (patterns.loopKeywords.test(lineContent) && index > 0) {
                // Check previous non-empty lines for loop
                for (let i = index - 1; i >= Math.max(0, index - 5); i--) {
                    if (patterns.loopKeywords.test(lines[i]) && !lines[i].includes('}')) {
                        comments.push({
                            id: uuidv4(),
                            type: 'performance',
                            severity: 'medium',
                            line,
                            message: 'Nested loop detected',
                            rationale: 'Nested loops can lead to O(n²) complexity. Consider optimization.',
                        });
                        break;
                    }
                }
            }

            // 12. Unused variable pattern (basic)
            if (this.detectUnusedVariable(lineContent, lines, index, language)) {
                comments.push({
                    id: uuidv4(),
                    type: 'refactor',
                    severity: 'low',
                    line,
                    message: 'Potentially unused variable',
                    suggestion: 'Remove unused variables or use them.',
                    rationale: 'Unused variables clutter code and may indicate incomplete logic.',
                });
            }

            // 13. SQL Injection pattern (basic)
            if (this.detectSQLInjection(lineContent)) {
                comments.push({
                    id: uuidv4(),
                    type: 'security',
                    severity: 'high',
                    line,
                    message: 'Potential SQL injection vulnerability',
                    suggestion: 'Use parameterized queries or an ORM.',
                    rationale: 'String concatenation in SQL queries can lead to injection attacks.',
                });
            }

            // 14. XSS pattern (basic)
            if (this.detectXSS(lineContent, language)) {
                comments.push({
                    id: uuidv4(),
                    type: 'security',
                    severity: 'high',
                    line,
                    message: 'Potential XSS vulnerability',
                    suggestion: 'Sanitize user input before rendering.',
                    rationale: 'Unsanitized input can lead to cross-site scripting attacks.',
                });
            }
        });

        // File-level checks
        if (lines.length > 300) {
            comments.push({
                id: uuidv4(),
                type: 'refactor',
                severity: 'medium',
                line: 1,
                message: 'File is too long (>300 lines)',
                rationale: 'Large files are harder to maintain. Consider splitting into modules.',
            });
        }

        // Calculate stats using ML-like algorithms
        const stats = this.calculateStats(comments, lines.length, functionCount, branchCount);

        return { reviews: comments, stats };
    }

    private calculateStats(
        comments: ReviewComment[],
        linesOfCode: number,
        functionCount: number,
        branchCount: number
    ) {
        const highSeverity = comments.filter(c => c.severity === 'high').length;
        const mediumSeverity = comments.filter(c => c.severity === 'medium').length;
        const lowSeverity = comments.filter(c => c.severity === 'low').length;

        // Cyclomatic complexity estimate
        const complexity = functionCount > 0 ? branchCount / functionCount : branchCount;

        // ML-inspired Quality Score calculation
        // Base score of 100, deduct based on issues
        let qualityScore = 100;
        qualityScore -= highSeverity * 15;    // High severity issues heavily penalized
        qualityScore -= mediumSeverity * 8;   // Medium severity moderately penalized
        qualityScore -= lowSeverity * 2;      // Low severity lightly penalized

        // Penalty for high complexity
        if (complexity > 10) qualityScore -= 10;
        else if (complexity > 5) qualityScore -= 5;

        // Penalty for very long files
        if (linesOfCode > 500) qualityScore -= 10;
        else if (linesOfCode > 300) qualityScore -= 5;

        // Normalize to 0-100
        qualityScore = Math.max(0, Math.min(100, qualityScore));

        return {
            totalIssues: comments.length,
            highSeverity,
            mediumSeverity,
            lowSeverity,
            qualityScore: Math.round(qualityScore * 10) / 10,
            complexity: Math.round(complexity * 10) / 10,
            linesOfCode,
        };
    }

    // Helper methods for generating fix suggestions
    private getConsoleFix(language: string, line: string): string {
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return '// ' + line.trim();
            case 'python':
                return '# ' + line.trim();
            case 'java':
            case 'cpp':
            case 'csharp':
                return '// ' + line.trim() + ' // Use logger instead';
            default:
                return '// Removed debug statement';
        }
    }

    private getSecretFix(language: string): string {
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return 'const secret = process.env.SECRET_KEY;';
            case 'python':
                return 'secret = os.environ.get("SECRET_KEY")';
            case 'java':
                return 'String secret = System.getenv("SECRET_KEY");';
            case 'go':
                return 'secret := os.Getenv("SECRET_KEY")';
            default:
                return 'Use environment variables';
        }
    }

    private getMagicNumberFix(language: string, line: string): string {
        const match = line.match(/\b(\d{2,})\b/);
        if (!match) return line;
        const num = match[1];
        switch (language.toLowerCase()) {
            case 'javascript':
            case 'typescript':
                return `const CONSTANT_${num} = ${num}; // Define at top of file`;
            case 'python':
                return `CONSTANT_${num} = ${num}  # Define at module level`;
            case 'java':
                return `private static final int CONSTANT_${num} = ${num};`;
            default:
                return `Extract ${num} to a named constant`;
        }
    }

    private isArrayIndex(line: string): boolean {
        return /\[\d+\]/.test(line);
    }

    private detectUnusedVariable(line: string, allLines: string[], currentIndex: number, language: string): boolean {
        // Very basic detection: variable declared but not used elsewhere
        const jsVarMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=/);
        const pyVarMatch = line.match(/^(\w+)\s*=\s*[^=]/);

        const match = jsVarMatch || pyVarMatch;
        if (!match) return false;

        const varName = match[1];
        if (varName.startsWith('_')) return false; // Underscore convention for unused

        // Check if variable is used elsewhere (simple check)
        let usageCount = 0;
        for (let i = 0; i < allLines.length; i++) {
            if (i !== currentIndex && new RegExp(`\\b${varName}\\b`).test(allLines[i])) {
                usageCount++;
            }
        }
        return usageCount === 0;
    }

    private detectSQLInjection(line: string): boolean {
        // Detect string concatenation in SQL queries
        const sqlPatterns = [
            /["'`]SELECT.*\+.*["'`]/i,
            /["'`]INSERT.*\+.*["'`]/i,
            /["'`]UPDATE.*\+.*["'`]/i,
            /["'`]DELETE.*\+.*["'`]/i,
            /query\s*\(\s*["'`].*\$\{/i,
            /execute\s*\(\s*["'`].*\+/i,
        ];
        return sqlPatterns.some(p => p.test(line));
    }

    private detectXSS(line: string, language: string): boolean {
        const xssPatterns = [
            /innerHTML\s*=/,
            /dangerouslySetInnerHTML/,
            /document\.write\s*\(/,
            /\.html\s*\(\s*\$?\w+\s*\)/,  // jQuery .html(variable)
        ];
        if (['javascript', 'typescript'].includes(language.toLowerCase())) {
            return xssPatterns.some(p => p.test(line));
        }
        return false;
    }
}
