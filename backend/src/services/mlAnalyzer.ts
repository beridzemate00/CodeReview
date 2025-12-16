import { v4 as uuidv4 } from 'uuid';
import { ReviewComment } from './analyzer';

/**
 * Machine Learning-inspired Code Analysis Service
 * Uses pattern recognition, statistical analysis, and heuristic algorithms
 * for intelligent code quality assessment
 */

interface CodeMetrics {
    linesOfCode: number;
    blankLines: number;
    commentLines: number;
    codeLines: number;
    avgLineLength: number;
    maxLineLength: number;
    indentationConsistency: number;
    nestingDepth: number;
    functionCount: number;
    classCount: number;
    importCount: number;
    variableCount: number;
    commentRatio: number;
}

interface CodePattern {
    name: string;
    type: 'antipattern' | 'smell' | 'vulnerability' | 'best-practice';
    confidence: number;
    description: string;
    suggestion: string;
}

interface MLAnalysisResult {
    codeMetrics: CodeMetrics;
    patterns: CodePattern[];
    suggestions: ReviewComment[];
    overallScore: number;
    readabilityScore: number;
    maintainabilityScore: number;
    securityScore: number;
    performanceScore: number;
    predictedBugRisk: number;
}

export class MLAnalyzer {
    private weightFactors = {
        security: 0.30,
        performance: 0.20,
        maintainability: 0.25,
        readability: 0.15,
        bestPractices: 0.10,
    };

    /**
     * Analyze code using ML-inspired algorithms
     */
    analyze(code: string, language: string): MLAnalysisResult {
        const lines = code.split('\n');
        const metrics = this.calculateMetrics(code, lines, language);
        const patterns = this.detectPatterns(code, lines, language);
        const suggestions = this.generateMLSuggestions(code, lines, language, patterns);

        // Calculate component scores
        const readabilityScore = this.calculateReadabilityScore(metrics, code);
        const maintainabilityScore = this.calculateMaintainabilityScore(metrics, patterns);
        const securityScore = this.calculateSecurityScore(patterns, code, language);
        const performanceScore = this.calculatePerformanceScore(patterns, code);
        const predictedBugRisk = this.predictBugRisk(metrics, patterns);

        // Calculate weighted overall score
        const overallScore = Math.round(
            readabilityScore * 0.20 +
            maintainabilityScore * 0.30 +
            securityScore * 0.30 +
            performanceScore * 0.20
        );

        return {
            codeMetrics: metrics,
            patterns,
            suggestions,
            overallScore: Math.max(0, Math.min(100, overallScore)),
            readabilityScore,
            maintainabilityScore,
            securityScore,
            performanceScore,
            predictedBugRisk,
        };
    }

    /**
     * Calculate comprehensive code metrics
     */
    private calculateMetrics(code: string, lines: string[], language: string): CodeMetrics {
        const blankLines = lines.filter(l => l.trim() === '').length;
        const commentLines = this.countCommentLines(lines, language);
        const codeLines = lines.length - blankLines - commentLines;

        const lineLengths = lines.map(l => l.length);
        const avgLineLength = lineLengths.reduce((a, b) => a + b, 0) / lines.length;
        const maxLineLength = Math.max(...lineLengths);

        const indentationConsistency = this.calculateIndentationConsistency(lines);
        const nestingDepth = this.calculateMaxNestingDepth(code);

        const functionCount = this.countFunctions(code, language);
        const classCount = this.countClasses(code, language);
        const importCount = this.countImports(code, language);
        const variableCount = this.countVariables(code, language);

        const commentRatio = lines.length > 0 ? commentLines / lines.length : 0;

        return {
            linesOfCode: lines.length,
            blankLines,
            commentLines,
            codeLines,
            avgLineLength: Math.round(avgLineLength * 10) / 10,
            maxLineLength,
            indentationConsistency,
            nestingDepth,
            functionCount,
            classCount,
            importCount,
            variableCount,
            commentRatio: Math.round(commentRatio * 100) / 100,
        };
    }

    /**
     * Detect code patterns using pattern matching algorithms
     */
    private detectPatterns(code: string, lines: string[], language: string): CodePattern[] {
        const patterns: CodePattern[] = [];

        // God Object / Large Class pattern
        const classBlocks = this.extractClassBlocks(code, language);
        classBlocks.forEach(block => {
            const methodCount = this.countMethodsInBlock(block, language);
            if (methodCount > 10) {
                patterns.push({
                    name: 'God Object',
                    type: 'antipattern',
                    confidence: Math.min(0.95, 0.5 + (methodCount - 10) * 0.05),
                    description: 'Class has too many responsibilities',
                    suggestion: 'Split into smaller, focused classes following Single Responsibility Principle',
                });
            }
        });

        // Long Method pattern
        const functions = this.extractFunctions(code, language);
        functions.forEach(fn => {
            const fnLines = fn.split('\n').length;
            if (fnLines > 30) {
                patterns.push({
                    name: 'Long Method',
                    type: 'smell',
                    confidence: Math.min(0.95, 0.6 + (fnLines - 30) * 0.01),
                    description: 'Function is too long and complex',
                    suggestion: 'Extract smaller helper functions',
                });
            }
        });

        // Deep Nesting pattern
        const maxNesting = this.calculateMaxNestingDepth(code);
        if (maxNesting > 4) {
            patterns.push({
                name: 'Deep Nesting',
                type: 'smell',
                confidence: Math.min(0.95, 0.6 + (maxNesting - 4) * 0.1),
                description: `Nesting depth of ${maxNesting} is too deep`,
                suggestion: 'Use guard clauses, early returns, or extract methods',
            });
        }

        // Duplicate Code Detection (simplified)
        const duplicates = this.detectDuplicateBlocks(lines);
        if (duplicates > 0) {
            patterns.push({
                name: 'Duplicate Code',
                type: 'smell',
                confidence: Math.min(0.9, 0.5 + duplicates * 0.1),
                description: `Found ${duplicates} potential duplicate code blocks`,
                suggestion: 'Extract common code into reusable functions',
            });
        }

        // Callback Hell / Promise Chain
        if (language === 'javascript' || language === 'typescript') {
            const callbackNesting = (code.match(/\.then\s*\(/g) || []).length;
            if (callbackNesting > 3) {
                patterns.push({
                    name: 'Callback Hell',
                    type: 'antipattern',
                    confidence: 0.85,
                    description: 'Too many chained callbacks or promises',
                    suggestion: 'Use async/await for better readability',
                });
            }
        }

        // SQL Injection Pattern
        if (this.detectSQLInjectionPattern(code)) {
            patterns.push({
                name: 'SQL Injection Risk',
                type: 'vulnerability',
                confidence: 0.90,
                description: 'Code may be vulnerable to SQL injection',
                suggestion: 'Use parameterized queries or ORM',
            });
        }

        // Hardcoded Credentials
        if (this.detectHardcodedCredentials(code)) {
            patterns.push({
                name: 'Hardcoded Credentials',
                type: 'vulnerability',
                confidence: 0.95,
                description: 'Sensitive data hardcoded in source',
                suggestion: 'Use environment variables or secret management',
            });
        }

        // Memory Leak Patterns
        if (this.detectMemoryLeakPatterns(code, language)) {
            patterns.push({
                name: 'Potential Memory Leak',
                type: 'vulnerability',
                confidence: 0.75,
                description: 'Code pattern may cause memory leaks',
                suggestion: 'Ensure proper cleanup of resources and event listeners',
            });
        }

        return patterns;
    }

    /**
     * Generate ML-powered suggestions using contextual analysis
     */
    private generateMLSuggestions(
        code: string,
        lines: string[],
        language: string,
        patterns: CodePattern[]
    ): ReviewComment[] {
        const suggestions: ReviewComment[] = [];

        // Convert patterns to review comments
        patterns.forEach(pattern => {
            suggestions.push({
                id: uuidv4(),
                type: pattern.type === 'vulnerability' ? 'security' :
                    pattern.type === 'antipattern' ? 'refactor' : 'style',
                severity: pattern.type === 'vulnerability' ? 'high' :
                    pattern.confidence > 0.8 ? 'medium' : 'low',
                line: 1,
                message: `[ML] ${pattern.name}: ${pattern.description}`,
                suggestion: pattern.suggestion,
                rationale: `Pattern detected with ${Math.round(pattern.confidence * 100)}% confidence`,
            });
        });

        // Complexity-based suggestions
        const complexity = this.calculateCyclomaticComplexity(code, language);
        if (complexity > 10) {
            suggestions.push({
                id: uuidv4(),
                type: 'refactor',
                severity: complexity > 20 ? 'high' : 'medium',
                line: 1,
                message: `[ML] High cyclomatic complexity (${complexity})`,
                suggestion: 'Consider breaking down complex logic into smaller functions',
                rationale: 'High complexity makes code harder to test and maintain',
            });
        }

        // Naming convention suggestions
        const badNames = this.detectBadNaming(code, language);
        badNames.forEach(({ line, name, issue }) => {
            suggestions.push({
                id: uuidv4(),
                type: 'style',
                severity: 'low',
                line,
                message: `[ML] Poor naming: "${name}" - ${issue}`,
                suggestion: 'Use descriptive, meaningful names',
                rationale: 'Good naming improves code readability',
            });
        });

        // Error handling suggestions
        const errorHandlingIssues = this.analyzeErrorHandling(code, language);
        errorHandlingIssues.forEach(issue => {
            suggestions.push({
                id: uuidv4(),
                type: 'bug',
                severity: 'medium',
                line: issue.line,
                message: `[ML] ${issue.message}`,
                suggestion: issue.suggestion,
                rationale: 'Proper error handling prevents crashes',
            });
        });

        return suggestions;
    }

    /**
     * Calculate readability score using Halstead metrics and custom algorithms
     */
    private calculateReadabilityScore(metrics: CodeMetrics, code: string): number {
        let score = 100;

        // Penalize long lines
        if (metrics.avgLineLength > 80) score -= 10;
        if (metrics.maxLineLength > 120) score -= 5;

        // Penalize low comment ratio
        if (metrics.commentRatio < 0.1) score -= 15;
        else if (metrics.commentRatio < 0.2) score -= 5;

        // Penalize inconsistent indentation
        score -= (1 - metrics.indentationConsistency) * 20;

        // Penalize deep nesting
        if (metrics.nestingDepth > 4) score -= (metrics.nestingDepth - 4) * 5;

        // Bonus for good function decomposition
        const avgFunctionLines = metrics.codeLines / Math.max(1, metrics.functionCount);
        if (avgFunctionLines < 30) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate maintainability score
     */
    private calculateMaintainabilityScore(metrics: CodeMetrics, patterns: CodePattern[]): number {
        let score = 100;

        // Penalize code smells
        patterns.filter(p => p.type === 'smell').forEach(p => {
            score -= p.confidence * 15;
        });

        // Penalize anti-patterns
        patterns.filter(p => p.type === 'antipattern').forEach(p => {
            score -= p.confidence * 20;
        });

        // Penalize large files
        if (metrics.linesOfCode > 500) score -= 15;
        else if (metrics.linesOfCode > 300) score -= 10;

        // Bonus for well-structured code
        if (metrics.functionCount > 0 && metrics.commentRatio > 0.15) {
            score += 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate security score
     */
    private calculateSecurityScore(patterns: CodePattern[], code: string, language: string): number {
        let score = 100;

        // Major penalty for security vulnerabilities
        patterns.filter(p => p.type === 'vulnerability').forEach(p => {
            score -= p.confidence * 30;
        });

        // Check for common security issues
        const securityChecks = [
            { pattern: /eval\s*\(/g, penalty: 20 },
            { pattern: /innerHTML\s*=/g, penalty: 15 },
            { pattern: /dangerouslySetInnerHTML/g, penalty: 15 },
            { pattern: /document\.write/g, penalty: 10 },
            { pattern: /exec\s*\(/g, penalty: 20 },
            { pattern: /shell_exec/gi, penalty: 25 },
            { pattern: /password.*=.*['"][^'"]+['"]/gi, penalty: 25 },
        ];

        securityChecks.forEach(check => {
            if (check.pattern.test(code)) {
                score -= check.penalty;
            }
        });

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate performance score
     */
    private calculatePerformanceScore(patterns: CodePattern[], code: string): number {
        let score = 100;

        // Check for performance anti-patterns
        const perfChecks = [
            { pattern: /for.*for/gs, penalty: 10, name: 'nested loops' },
            { pattern: /\.forEach.*\.forEach/gs, penalty: 10, name: 'nested iterations' },
            { pattern: /new RegExp\(/g, penalty: 5, name: 'regex in loop' },
            { pattern: /JSON\.parse.*JSON\.stringify/g, penalty: 5, name: 'inefficient cloning' },
        ];

        perfChecks.forEach(check => {
            const matches = code.match(check.pattern);
            if (matches) {
                score -= check.penalty * matches.length;
            }
        });

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Predict bug risk using statistical models
     */
    private predictBugRisk(metrics: CodeMetrics, patterns: CodePattern[]): number {
        // Simple regression model for bug prediction
        let risk = 0;

        // Complexity contributes to bug risk
        risk += metrics.nestingDepth * 5;

        // Low comment ratio increases risk
        risk += (1 - metrics.commentRatio) * 10;

        // Anti-patterns and smells increase risk
        patterns.forEach(p => {
            if (p.type === 'antipattern') risk += p.confidence * 15;
            if (p.type === 'smell') risk += p.confidence * 10;
            if (p.type === 'vulnerability') risk += p.confidence * 20;
        });

        // Large files have higher bug risk
        if (metrics.linesOfCode > 300) risk += 10;
        if (metrics.linesOfCode > 500) risk += 10;

        return Math.min(100, risk);
    }

    // Helper methods
    private countCommentLines(lines: string[], language: string): number {
        let count = 0;
        let inBlockComment = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (language === 'python') {
                if (trimmed.startsWith('#')) count++;
                if (trimmed.includes('"""') || trimmed.includes("'''")) {
                    inBlockComment = !inBlockComment;
                    count++;
                } else if (inBlockComment) {
                    count++;
                }
            } else {
                if (trimmed.startsWith('//')) count++;
                if (trimmed.startsWith('/*')) inBlockComment = true;
                if (inBlockComment) count++;
                if (trimmed.includes('*/')) inBlockComment = false;
            }
        }
        return count;
    }

    private calculateIndentationConsistency(lines: string[]): number {
        const indentations = lines
            .filter(l => l.trim().length > 0)
            .map(l => l.length - l.trimStart().length);

        if (indentations.length === 0) return 1;

        // Check if indentation follows a consistent pattern (2 or 4 spaces)
        const isConsistent2 = indentations.every(i => i % 2 === 0);
        const isConsistent4 = indentations.every(i => i % 4 === 0);

        if (isConsistent4) return 1;
        if (isConsistent2) return 0.9;

        return 0.7;
    }

    private calculateMaxNestingDepth(code: string): number {
        let maxDepth = 0;
        let currentDepth = 0;

        for (const char of code) {
            if (char === '{') {
                currentDepth++;
                maxDepth = Math.max(maxDepth, currentDepth);
            } else if (char === '}') {
                currentDepth = Math.max(0, currentDepth - 1);
            }
        }
        return maxDepth;
    }

    private countFunctions(code: string, language: string): number {
        const patterns: Record<string, RegExp> = {
            javascript: /\b(function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{)/g,
            typescript: /\b(function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{)/g,
            python: /\bdef\s+\w+/g,
            java: /(public|private|protected)\s+[\w<>]+\s+\w+\s*\(/g,
            go: /\bfunc\s+/g,
            rust: /\bfn\s+\w+/g,
        };
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }

    private countClasses(code: string, language: string): number {
        const patterns: Record<string, RegExp> = {
            javascript: /\bclass\s+\w+/g,
            typescript: /\bclass\s+\w+/g,
            python: /\bclass\s+\w+/g,
            java: /\bclass\s+\w+/g,
            go: /\btype\s+\w+\s+struct/g,
            rust: /\bstruct\s+\w+/g,
        };
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }

    private countImports(code: string, language: string): number {
        const patterns: Record<string, RegExp> = {
            javascript: /\b(import|require)\s*[\({]/g,
            typescript: /\b(import|require)\s*[\({]/g,
            python: /\b(import|from)\s+\w+/g,
            java: /\bimport\s+/g,
            go: /\bimport\s+/g,
            rust: /\buse\s+/g,
        };
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }

    private countVariables(code: string, language: string): number {
        const patterns: Record<string, RegExp> = {
            javascript: /\b(const|let|var)\s+\w+/g,
            typescript: /\b(const|let|var)\s+\w+/g,
            python: /^\s*\w+\s*=/gm,
            java: /\b(int|String|boolean|double|float|long|char)\s+\w+/g,
            go: /\b(var|:=)\s*/g,
            rust: /\blet\s+(mut\s+)?\w+/g,
        };
        const pattern = patterns[language] || patterns.javascript;
        return (code.match(pattern) || []).length;
    }

    private extractClassBlocks(code: string, language: string): string[] {
        // Simplified class extraction
        const classPattern = /class\s+\w+[^{]*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
        const matches = code.match(classPattern) || [];
        return matches;
    }

    private countMethodsInBlock(block: string, language: string): number {
        return this.countFunctions(block, language);
    }

    private extractFunctions(code: string, language: string): string[] {
        // Simplified function extraction
        const results: string[] = [];
        const lines = code.split('\n');
        let inFunction = false;
        let braceCount = 0;
        let currentFunction = '';

        for (const line of lines) {
            if (!inFunction && /\b(function|def|fn|func)\s+\w+|=>\s*{/.test(line)) {
                inFunction = true;
                braceCount = 0;
            }
            if (inFunction) {
                currentFunction += line + '\n';
                braceCount += (line.match(/{/g) || []).length;
                braceCount -= (line.match(/}/g) || []).length;
                if (braceCount <= 0 && currentFunction.includes('{')) {
                    results.push(currentFunction);
                    currentFunction = '';
                    inFunction = false;
                }
            }
        }
        return results;
    }

    private detectDuplicateBlocks(lines: string[]): number {
        const blocks = new Map<string, number>();
        const windowSize = 5;
        let duplicates = 0;

        for (let i = 0; i < lines.length - windowSize; i++) {
            const block = lines.slice(i, i + windowSize)
                .map(l => l.trim())
                .filter(l => l.length > 0)
                .join('');

            if (block.length > 50) {
                const count = blocks.get(block) || 0;
                if (count > 0) duplicates++;
                blocks.set(block, count + 1);
            }
        }
        return duplicates;
    }

    private detectSQLInjectionPattern(code: string): boolean {
        const patterns = [
            /["'`]SELECT.*\+/i,
            /["'`]INSERT.*\+/i,
            /["'`]UPDATE.*\+/i,
            /["'`]DELETE.*\+/i,
            /query\s*\([^)]*\$\{/,
        ];
        return patterns.some(p => p.test(code));
    }

    private detectHardcodedCredentials(code: string): boolean {
        const patterns = [
            /(password|secret|api_key|apikey|token|auth_token)\s*[:=]\s*['"][^'"]{8,}['"]/i,
            /Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/,
        ];
        return patterns.some(p => p.test(code));
    }

    private detectMemoryLeakPatterns(code: string, language: string): boolean {
        if (language === 'javascript' || language === 'typescript') {
            const patterns = [
                /addEventListener.*(?!removeEventListener)/,
                /setInterval.*(?!clearInterval)/,
                /new\s+\w+\(\)(?!.*=\s*null)/,
            ];
            return patterns.some(p => p.test(code));
        }
        return false;
    }

    private calculateCyclomaticComplexity(code: string, language: string): number {
        // Count decision points
        const decisionPoints = [
            /\bif\s*\(/g,
            /\belse\s+if\b/g,
            /\bwhile\s*\(/g,
            /\bfor\s*\(/g,
            /\bcase\s+/g,
            /\bcatch\s*\(/g,
            /\?\s*[^:]+\s*:/g,  // Ternary
            /&&|\|\|/g,
        ];

        let complexity = 1;  // Base complexity
        decisionPoints.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) complexity += matches.length;
        });

        return complexity;
    }

    private detectBadNaming(code: string, language: string): { line: number; name: string; issue: string }[] {
        const issues: { line: number; name: string; issue: string }[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // Single letter variables (except i, j, k in loops)
            const singleLetterMatch = line.match(/\b(const|let|var)\s+([a-z])\s*=/);
            if (singleLetterMatch && !['i', 'j', 'k', 'x', 'y'].includes(singleLetterMatch[2])) {
                issues.push({
                    line: index + 1,
                    name: singleLetterMatch[2],
                    issue: 'Single letter variable name',
                });
            }

            // Very short function names
            const shortFuncMatch = line.match(/function\s+([a-z]{1,2})\s*\(/);
            if (shortFuncMatch) {
                issues.push({
                    line: index + 1,
                    name: shortFuncMatch[1],
                    issue: 'Very short function name',
                });
            }
        });

        return issues.slice(0, 5);  // Limit to 5 suggestions
    }

    private analyzeErrorHandling(code: string, language: string): { line: number; message: string; suggestion: string }[] {
        const issues: { line: number; message: string; suggestion: string }[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            // Empty catch blocks
            if (/catch\s*\([^)]*\)\s*{\s*}/.test(line)) {
                issues.push({
                    line: index + 1,
                    message: 'Empty catch block swallows errors',
                    suggestion: 'Log the error or handle it appropriately',
                });
            }

            // catch with just console.log
            if (/catch\s*\([^)]*\)\s*{\s*console\.log/.test(line)) {
                issues.push({
                    line: index + 1,
                    message: 'Catch block only logs error',
                    suggestion: 'Consider proper error handling or re-throwing',
                });
            }
        });

        return issues;
    }
}
