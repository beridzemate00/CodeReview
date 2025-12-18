import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { ReviewComment } from './analyzer';
import { aiCache } from './cacheService';

/**
 * Gemini AI-Powered Code Review Service
 * Uses Google's Gemini 2.5 Flash for intelligent code analysis
 * Now with caching support to reduce API calls
 */

interface GeminiReviewResult {
    reviews: ReviewComment[];
    summary: string;
    overallAssessment: string;
    suggestedImprovements: string[];
}

export class GeminiAnalyzer {
    private ai: GoogleGenAI | null = null;
    private model = 'gemini-2.5-flash';

    constructor() {
        // The client gets the API key from environment variable `GEMINI_API_KEY`
        if (process.env.GEMINI_API_KEY) {
            this.ai = new GoogleGenAI({});
        }
    }

    setApiKey(apiKey: string) {
        // For dynamic API key, we need to set the env var
        process.env.GEMINI_API_KEY = apiKey;
        this.ai = new GoogleGenAI({});
    }

    isConfigured(): boolean {
        return this.ai !== null && !!process.env.GEMINI_API_KEY;
    }

    async analyze(code: string, language: string, skipCache = false): Promise<GeminiReviewResult> {
        if (!this.ai) {
            throw new Error('Gemini API key not configured');
        }

        // Check cache first (unless skipping)
        const cacheKey = aiCache.generateKey(code, language);
        if (!skipCache) {
            const cachedResult = aiCache.get<GeminiReviewResult>(cacheKey);
            if (cachedResult) {
                console.log('🎯 Cache hit for Gemini analysis');
                return cachedResult;
            }
        }

        const prompt = this.buildPrompt(code, language);

        try {
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
            });

            const text = response.text || '';
            const result = this.parseResponse(text, code);

            // Cache the result (2 hours TTL)
            aiCache.set(cacheKey, result, 7200);
            console.log('💾 Cached Gemini analysis result');

            return result;
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Failed to analyze code with Gemini AI');
        }
    }

    private buildPrompt(code: string, language: string): string {
        return `You are an expert code reviewer. Analyze the following ${language} code and provide a comprehensive review.

**Code to Review:**
\`\`\`${language}
${code}
\`\`\`

**Please provide your review in the following JSON format:**
{
    "summary": "A brief 1-2 sentence summary of the code quality",
    "overallAssessment": "excellent | good | needs_improvement | poor",
    "issues": [
        {
            "type": "bug | security | performance | refactor | style",
            "severity": "high | medium | low",
            "line": <line_number or 1 if general>,
            "message": "Description of the issue",
            "suggestion": "How to fix it",
            "rationale": "Why this matters"
        }
    ],
    "suggestedImprovements": [
        "Improvement suggestion 1",
        "Improvement suggestion 2"
    ],
    "positiveAspects": [
        "What the code does well"
    ]
}

**Review Guidelines:**
1. Check for bugs, logic errors, and edge cases
2. Identify security vulnerabilities (SQL injection, XSS, hardcoded secrets, etc.)
3. Find performance issues (inefficient algorithms, memory leaks, etc.)
4. Suggest refactoring opportunities (code smells, DRY violations, etc.)
5. Note style issues (naming conventions, formatting, comments)
6. Be specific about line numbers where possible
7. Provide actionable suggestions for each issue

Respond ONLY with valid JSON, no markdown code blocks or extra text.`;
    }

    private parseResponse(responseText: string, code: string): GeminiReviewResult {
        const reviews: ReviewComment[] = [];
        let summary = 'AI analysis completed';
        let overallAssessment = 'good';
        let suggestedImprovements: string[] = [];

        try {
            // Clean the response - remove markdown code blocks if present
            let cleanedText = responseText.trim();
            if (cleanedText.startsWith('```json')) {
                cleanedText = cleanedText.slice(7);
            }
            if (cleanedText.startsWith('```')) {
                cleanedText = cleanedText.slice(3);
            }
            if (cleanedText.endsWith('```')) {
                cleanedText = cleanedText.slice(0, -3);
            }
            cleanedText = cleanedText.trim();

            const parsed = JSON.parse(cleanedText);

            summary = parsed.summary || summary;
            overallAssessment = parsed.overallAssessment || overallAssessment;
            suggestedImprovements = parsed.suggestedImprovements || [];

            // Convert issues to ReviewComment format
            if (parsed.issues && Array.isArray(parsed.issues)) {
                for (const issue of parsed.issues) {
                    reviews.push({
                        id: uuidv4(),
                        type: this.validateType(issue.type),
                        severity: this.validateSeverity(issue.severity),
                        line: typeof issue.line === 'number' ? issue.line : 1,
                        message: `[AI] ${issue.message || 'Issue detected'}`,
                        suggestion: issue.suggestion,
                        rationale: issue.rationale || 'Identified by Gemini AI',
                    });
                }
            }

            // Add positive aspects as informational comments
            if (parsed.positiveAspects && Array.isArray(parsed.positiveAspects)) {
                for (const positive of parsed.positiveAspects.slice(0, 2)) {
                    reviews.push({
                        id: uuidv4(),
                        type: 'style',
                        severity: 'low',
                        line: 1,
                        message: `[AI] ✓ ${positive}`,
                        rationale: 'Positive observation from AI analysis',
                    });
                }
            }

        } catch (parseError) {
            console.error('Failed to parse Gemini response:', parseError);
            // Return a fallback review if parsing fails
            reviews.push({
                id: uuidv4(),
                type: 'refactor',
                severity: 'low',
                line: 1,
                message: '[AI] Code analysis completed',
                rationale: responseText.substring(0, 200),
            });
        }

        return {
            reviews,
            summary,
            overallAssessment,
            suggestedImprovements,
        };
    }

    private validateType(type: string): ReviewComment['type'] {
        const validTypes = ['bug', 'security', 'performance', 'refactor', 'style'];
        return validTypes.includes(type) ? type as ReviewComment['type'] : 'refactor';
    }

    private validateSeverity(severity: string): ReviewComment['severity'] {
        const validSeverities = ['high', 'medium', 'low'];
        return validSeverities.includes(severity) ? severity as ReviewComment['severity'] : 'medium';
    }
}

// Singleton instance
let geminiInstance: GeminiAnalyzer | null = null;

export function getGeminiAnalyzer(): GeminiAnalyzer {
    if (!geminiInstance) {
        geminiInstance = new GeminiAnalyzer();
    }
    return geminiInstance;
}
