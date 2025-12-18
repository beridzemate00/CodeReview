interface ReviewIssue {
    id: string;
    type: string;
    severity: string;
    message: string;
    line?: number;
    suggestion?: string;
    fixCode?: string;
}

interface ReviewData {
    id: string;
    fileName: string;
    language: string;
    code: string;
    qualityScore: number;
    readabilityScore?: number;
    maintainabilityScore?: number;
    securityScore?: number;
    performanceScore?: number;
    issueCount: number;
    highSeverity: number;
    mediumSeverity: number;
    lowSeverity: number;
    issues: ReviewIssue[];
    createdAt: string;
}

interface ExportOptions {
    includeCode?: boolean;
    includeSuggestions?: boolean;
    includeMetadata?: boolean;
}

class ExportService {
    /**
     * Export review data to JSON format
     */
    toJSON(review: ReviewData, options: ExportOptions = {}): string {
        const {
            includeCode = true,
            includeSuggestions = true,
            includeMetadata = true
        } = options;

        const exportData: any = {
            exportedAt: new Date().toISOString(),
            exportFormat: 'json',
            version: '1.0',
            review: {
                id: review.id,
                fileName: review.fileName,
                language: review.language,
                scores: {
                    quality: review.qualityScore,
                    readability: review.readabilityScore,
                    maintainability: review.maintainabilityScore,
                    security: review.securityScore,
                    performance: review.performanceScore
                },
                summary: {
                    totalIssues: review.issueCount,
                    highSeverity: review.highSeverity,
                    mediumSeverity: review.mediumSeverity,
                    lowSeverity: review.lowSeverity
                },
                issues: review.issues.map(issue => ({
                    id: issue.id,
                    type: issue.type,
                    severity: issue.severity,
                    line: issue.line,
                    message: issue.message,
                    ...(includeSuggestions && {
                        suggestion: issue.suggestion,
                        fixCode: issue.fixCode
                    })
                }))
            }
        };

        if (includeCode) {
            exportData.review.code = review.code;
        }

        if (includeMetadata) {
            exportData.metadata = {
                createdAt: review.createdAt,
                exportedBy: 'CodeReview.ai'
            };
        }

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Export review data to HTML format (for PDF generation)
     */
    toHTML(review: ReviewData, options: ExportOptions = {}): string {
        const {
            includeCode = true,
            includeSuggestions = true
        } = options;

        const severityColors: Record<string, string> = {
            high: '#ef4444',
            medium: '#f59e0b',
            low: '#3b82f6'
        };

        const typeIcons: Record<string, string> = {
            bug: '🐛',
            security: '🔒',
            performance: '⚡',
            refactor: '🔧',
            style: '🎨'
        };

        const getScoreColor = (score: number): string => {
            if (score >= 80) return '#22c55e';
            if (score >= 60) return '#f59e0b';
            return '#ef4444';
        };

        let issuesHtml = '';
        review.issues.forEach((issue, index) => {
            issuesHtml += `
                <div style="border: 1px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #161b22;">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <span style="font-size: 20px;">${typeIcons[issue.type] || '📋'}</span>
                        <span style="background: ${severityColors[issue.severity]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">${issue.severity}</span>
                        <span style="color: #8b949e; font-size: 12px;">Line ${issue.line || 'N/A'}</span>
                    </div>
                    <p style="color: #f0f6fc; margin: 0 0 8px 0; font-size: 14px;">${issue.message}</p>
                    ${includeSuggestions && issue.suggestion ? `
                        <div style="background: #21262d; border-radius: 6px; padding: 12px; margin-top: 8px;">
                            <p style="color: #3b82f6; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">💡 Suggestion:</p>
                            <p style="color: #8b949e; margin: 0; font-size: 13px;">${issue.suggestion}</p>
                        </div>
                    ` : ''}
                    ${includeSuggestions && issue.fixCode ? `
                        <div style="background: #1a1e24; border-radius: 6px; padding: 12px; margin-top: 8px; font-family: 'Fira Code', monospace;">
                            <p style="color: #22c55e; font-size: 12px; margin: 0 0 4px 0; font-weight: 600;">✅ Suggested Fix:</p>
                            <pre style="color: #f0f6fc; margin: 0; font-size: 12px; overflow-x: auto;">${this.escapeHtml(issue.fixCode)}</pre>
                        </div>
                    ` : ''}
                </div>
            `;
        });

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Review Report - ${review.fileName}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; background: #0d1117; color: #f0f6fc; padding: 40px; line-height: 1.6; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #30363d; }
        .logo { font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { color: #8b949e; margin-top: 8px; }
        .scores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin: 24px 0; }
        .score-card { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; text-align: center; }
        .score-value { font-size: 36px; font-weight: 700; }
        .score-label { color: #8b949e; font-size: 12px; text-transform: uppercase; margin-top: 4px; }
        .summary { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 24px; margin: 24px 0; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center; margin-top: 16px; }
        .summary-item span { display: block; }
        .summary-count { font-size: 24px; font-weight: 600; }
        .issues-section { margin-top: 32px; }
        .section-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .code-section { margin-top: 32px; }
        .code-block { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; overflow-x: auto; }
        .code-block pre { font-family: 'Fira Code', monospace; font-size: 13px; line-height: 1.5; margin: 0; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #30363d; color: #8b949e; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">⟨/⟩ CodeReview.ai</div>
            <p class="subtitle">AI-Powered Code Review Report</p>
        </div>

        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; margin-bottom: 12px;">📁 ${this.escapeHtml(review.fileName)}</h2>
            <div style="display: flex; gap: 16px; color: #8b949e; font-size: 14px;">
                <span>Language: <strong style="color: #f0f6fc;">${review.language}</strong></span>
                <span>Reviewed: <strong style="color: #f0f6fc;">${new Date(review.createdAt).toLocaleString()}</strong></span>
            </div>
        </div>

        <div class="scores-grid">
            <div class="score-card">
                <div class="score-value" style="color: ${getScoreColor(review.qualityScore)};">${Math.round(review.qualityScore)}</div>
                <div class="score-label">Quality Score</div>
            </div>
            ${review.readabilityScore !== undefined ? `
                <div class="score-card">
                    <div class="score-value" style="color: ${getScoreColor(review.readabilityScore)};">${Math.round(review.readabilityScore)}</div>
                    <div class="score-label">Readability</div>
                </div>
            ` : ''}
            ${review.securityScore !== undefined ? `
                <div class="score-card">
                    <div class="score-value" style="color: ${getScoreColor(review.securityScore)};">${Math.round(review.securityScore)}</div>
                    <div class="score-label">Security</div>
                </div>
            ` : ''}
            ${review.performanceScore !== undefined ? `
                <div class="score-card">
                    <div class="score-value" style="color: ${getScoreColor(review.performanceScore)};">${Math.round(review.performanceScore)}</div>
                    <div class="score-label">Performance</div>
                </div>
            ` : ''}
        </div>

        <div class="summary">
            <h3 style="font-size: 16px;">📊 Issue Summary</h3>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="summary-count" style="color: #f0f6fc;">${review.issueCount}</span>
                    <span style="color: #8b949e; font-size: 12px;">Total Issues</span>
                </div>
                <div class="summary-item">
                    <span class="summary-count" style="color: #ef4444;">${review.highSeverity}</span>
                    <span style="color: #8b949e; font-size: 12px;">High</span>
                </div>
                <div class="summary-item">
                    <span class="summary-count" style="color: #f59e0b;">${review.mediumSeverity}</span>
                    <span style="color: #8b949e; font-size: 12px;">Medium</span>
                </div>
                <div class="summary-item">
                    <span class="summary-count" style="color: #3b82f6;">${review.lowSeverity}</span>
                    <span style="color: #8b949e; font-size: 12px;">Low</span>
                </div>
            </div>
        </div>

        ${review.issues.length > 0 ? `
            <div class="issues-section">
                <h3 class="section-title">🔍 Issues Found</h3>
                ${issuesHtml}
            </div>
        ` : `
            <div style="text-align: center; padding: 40px; color: #22c55e;">
                <span style="font-size: 48px;">✅</span>
                <h3 style="margin-top: 16px;">No Issues Found!</h3>
                <p style="color: #8b949e;">Your code looks great.</p>
            </div>
        `}

        ${includeCode ? `
            <div class="code-section">
                <h3 class="section-title">📝 Reviewed Code</h3>
                <div class="code-block">
                    <pre>${this.escapeHtml(review.code)}</pre>
                </div>
            </div>
        ` : ''}

        <div class="footer">
            <p>Generated by CodeReview.ai on ${new Date().toLocaleString()}</p>
            <p style="margin-top: 4px;">AI-powered code reviews for developers</p>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Export review data to Markdown format
     */
    toMarkdown(review: ReviewData, options: ExportOptions = {}): string {
        const {
            includeCode = true,
            includeSuggestions = true
        } = options;

        const severityEmoji: Record<string, string> = {
            high: '🔴',
            medium: '🟡',
            low: '🔵'
        };

        const typeEmoji: Record<string, string> = {
            bug: '🐛',
            security: '🔒',
            performance: '⚡',
            refactor: '🔧',
            style: '🎨'
        };

        let md = `# Code Review Report

**File:** ${review.fileName}  
**Language:** ${review.language}  
**Reviewed:** ${new Date(review.createdAt).toLocaleString()}

---

## 📊 Scores

| Metric | Score |
|--------|-------|
| Quality | ${Math.round(review.qualityScore)}/100 |
${review.readabilityScore !== undefined ? `| Readability | ${Math.round(review.readabilityScore)}/100 |\n` : ''}${review.maintainabilityScore !== undefined ? `| Maintainability | ${Math.round(review.maintainabilityScore)}/100 |\n` : ''}${review.securityScore !== undefined ? `| Security | ${Math.round(review.securityScore)}/100 |\n` : ''}${review.performanceScore !== undefined ? `| Performance | ${Math.round(review.performanceScore)}/100 |\n` : ''}

## 📋 Summary

- **Total Issues:** ${review.issueCount}
- 🔴 **High:** ${review.highSeverity}
- 🟡 **Medium:** ${review.mediumSeverity}
- 🔵 **Low:** ${review.lowSeverity}

---

## 🔍 Issues

`;

        if (review.issues.length === 0) {
            md += '✅ **No issues found!** Your code looks great.\n\n';
        } else {
            review.issues.forEach((issue, index) => {
                md += `### ${index + 1}. ${typeEmoji[issue.type] || '📋'} ${issue.type.charAt(0).toUpperCase() + issue.type.slice(1)} Issue

${severityEmoji[issue.severity]} **Severity:** ${issue.severity.toUpperCase()}  
📍 **Line:** ${issue.line || 'N/A'}

${issue.message}

`;
                if (includeSuggestions && issue.suggestion) {
                    md += `> 💡 **Suggestion:** ${issue.suggestion}\n\n`;
                }
                if (includeSuggestions && issue.fixCode) {
                    md += `**Suggested Fix:**
\`\`\`${review.language}
${issue.fixCode}
\`\`\`

`;
                }
                md += '---\n\n';
            });
        }

        if (includeCode) {
            md += `## 📝 Reviewed Code

\`\`\`${review.language}
${review.code}
\`\`\`

`;
        }

        md += `---

*Generated by [CodeReview.ai](https://codereview.ai) on ${new Date().toLocaleString()}*
`;

        return md;
    }

    /**
     * Export to CSV format (simplified issue list)
     */
    toCSV(review: ReviewData): string {
        const headers = ['Issue #', 'Type', 'Severity', 'Line', 'Message', 'Suggestion'];
        const rows = review.issues.map((issue, index) => [
            (index + 1).toString(),
            issue.type,
            issue.severity,
            (issue.line || 'N/A').toString(),
            `"${issue.message.replace(/"/g, '""')}"`,
            `"${(issue.suggestion || '').replace(/"/g, '""')}"`
        ]);

        return [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    }

    /**
     * Escape HTML special characters
     */
    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

export const exportService = new ExportService();
export { ExportService, ReviewData, ReviewIssue, ExportOptions };
export default exportService;
