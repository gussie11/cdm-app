import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, FileText, CheckCircle2, HelpCircle, User, Brain, MessageCircleQuestion } from 'lucide-react';

function ResultView({ markdownContent, cleanedTableData, productName }) {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'markdown'

    const handleDownloadCsv = () => {
        if (!cleanedTableData || cleanedTableData.length === 0) return;

        try {
            const csvContent = cleanedTableData.map(e => e.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const safeName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            link.setAttribute("href", url);
            link.setAttribute("download", `CDM_${safeName}_strategy.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("Failed to download CSV", err);
        }
    };

    // Helper to format content by replacing <br> with newlines
    const formatContent = (text) => {
        if (!text) return "";
        return text.replace(/<br>/g, '\n');
    };

    const RUBIE_OPTIONS = [
        { id: 'ALL', label: 'ALL', desc: 'Combined view of all stakeholders.' },
        { id: 'RIPPLE', label: 'RIPPLE (Indirectly Affected)', desc: 'Downstream impact, disruption, and shared resources.' },
        { id: 'USER', label: 'USER (Direct Usage)', desc: 'Usability, effort, and day-to-day engagement.' },
        { id: 'BENEFACTOR', label: 'BENEFACTOR (Outcome Owner)', desc: 'Intangible outcomes, strategy, and value realization.' },
        { id: 'IMPLEMENTOR', label: 'IMPLEMENTOR (Deployment)', desc: 'Feasibility, platform, tech stack, and integration.' },
        { id: 'ECONOMIC BUYER', label: 'ECONOMIC BUYER (Budget)', desc: 'ROI, financial risk, and opportunity cost.' }
    ];

    const [selectedLenses, setSelectedLenses] = useState(["ALL"]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const handleLensToggle = (lensId) => {
        setSelectedLenses(prev => {
            if (lensId === "ALL") {
                return ["ALL"];
            }

            let next = prev.filter(l => l !== "ALL");
            if (next.includes(lensId)) {
                next = next.filter(l => l !== lensId);
            } else {
                next = [...next, lensId];
            }

            if (next.length === 0) return ["ALL"];
            return next;
        });
    };

    const handleSort = (index) => {
        setSortConfig(prev => {
            if (prev.key === index) {
                return { key: index, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key: index, direction: 'asc' };
        });
    };

    // Helper to get processed (filtered and sorted) rows
    const getProcessedRows = () => {
        if (!cleanedTableData || cleanedTableData.length <= 1) return [];

        const headers = cleanedTableData[0];
        let rows = cleanedTableData.slice(1);
        const lensIdx = headers.findIndex(h => h.toLowerCase().includes('lens'));

        // Filter by lens
        if (!selectedLenses.includes("ALL") && lensIdx !== -1) {
            rows = rows.filter(r => {
                const rowLens = (r[lensIdx] || "").toUpperCase();
                return selectedLenses.some(sel => rowLens.includes(sel));
            });
        }

        // Sort rows
        if (sortConfig.key !== null) {
            rows.sort((a, b) => {
                const valA = (a[sortConfig.key] || "").toString().toLowerCase();
                const valB = (b[sortConfig.key] || "").toString().toLowerCase();

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return rows;
    };

    // Helper to render cards
    const renderGrid = () => {
        if (!cleanedTableData || cleanedTableData.length <= 1) return <p style={{ color: 'var(--text-muted)' }}>No structured data found.</p>;

        const headers = cleanedTableData[0];
        const rows = getProcessedRows();

        // Find indices
        const stageIdx = headers.findIndex(h => h.toLowerCase().includes('stage'));
        const lensIdx = headers.findIndex(h => h.toLowerCase().includes('lens'));
        const obIdx = headers.findIndex(h => h.toLowerCase().includes('obligation'));
        const roleIdx = headers.findIndex(h => h.toLowerCase().includes('role'));
        const aiIdx = headers.findIndex(h => h.toLowerCase().includes('ai question'));
        const thinkingIdx = headers.findIndex(h => h.toLowerCase().includes('thinking'));
        const salesIdx = headers.findIndex(h => h.toLowerCase().includes('sales question'));
        const confIdx = headers.findIndex(h => h.toLowerCase().includes('confidence'));

        return (
            <div className="animate-fade-in">
                {/* Filter Bar */}
                <div className="input-group" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.75rem', fontWeight: 600 }}>
                        Filter by Stakeholder Lens (Multi-Select)
                    </div>
                    <div className="rubie-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                        {RUBIE_OPTIONS.map(opt => (
                            <div
                                key={opt.id}
                                className={`rubie-chip ${selectedLenses.includes(opt.id) ? 'selected' : ''}`}
                                onClick={() => handleLensToggle(opt.id)}
                            >
                                <div className="chip-checkbox">
                                    {selectedLenses.includes(opt.id) && <CheckCircle2 size={16} strokeWidth={3} color="white" />}
                                </div>
                                <div className="chip-content">
                                    <span className="chip-label">{opt.label}</span>
                                    <span className="chip-desc">{opt.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="result-grid">
                    {rows.map((row, idx) => (
                        <div key={idx} className="result-card">
                            <div className="card-header">
                                <span className="stage-badge">{row[stageIdx] || "Stage ?"}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    {lensIdx !== -1 && selectedLenses.includes("ALL") && (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                                            {row[lensIdx]}
                                        </span>
                                    )}
                                    {roleIdx !== -1 && (
                                        <span className="card-role" title="Responsible Role">
                                            <User size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                                            {row[roleIdx]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="card-body">
                                <Markdown remarkPlugins={[remarkGfm]}>
                                    {formatContent(row[obIdx])}
                                </Markdown>
                            </div>

                            <div className="card-footer">
                                {thinkingIdx !== -1 && row[thinkingIdx] && (
                                    <div className="thinking-section">
                                        <Brain size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom', color: 'var(--accent-primary)' }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Customer Thinking:</span>
                                        <div style={{ marginTop: '0.25rem', paddingLeft: '1.25rem' }}>{formatContent(row[thinkingIdx])}</div>
                                    </div>
                                )}

                                {salesIdx !== -1 && row[salesIdx] && (
                                    <div className="sales-section">
                                        <MessageCircleQuestion size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom', color: 'var(--accent-primary)' }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sales Question:</span>
                                        <div style={{ marginTop: '0.25rem', paddingLeft: '1.25rem', fontStyle: 'italic' }}>"{formatContent(row[salesIdx])}"</div>
                                    </div>
                                )}

                                {aiIdx !== -1 && row[aiIdx] && (
                                    <div className="ai-question">
                                        <HelpCircle size={14} style={{ marginRight: 6, verticalAlign: 'text-bottom', color: 'var(--accent-primary)' }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>AI Question:</span>
                                        <div style={{ marginTop: '0.25rem', paddingLeft: '1.25rem' }}>{formatContent(row[aiIdx])}</div>
                                    </div>
                                )}

                                {confIdx !== -1 && (
                                    <div className="confidence-indicator">
                                        <CheckCircle2 size={14} className={`conf-${row[confIdx]}`} />
                                        <span style={{ color: 'var(--text-muted)' }}>Confidence:</span>
                                        <span className={`conf-${row[confIdx]}`}>{row[confIdx]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderTable = () => {
        if (!cleanedTableData || cleanedTableData.length <= 1) return null;
        const headers = cleanedTableData[0];
        const rows = getProcessedRows();

        return (
            <div className="table-responsive animate-fade-in" style={{
                overflowX: 'auto',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginTop: '1.5rem'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <tr>
                            {headers.map((h, i) => (
                                <th
                                    key={i}
                                    onClick={() => handleSort(i)}
                                    style={{
                                        padding: '1rem',
                                        fontSize: '0.8rem',
                                        textTransform: 'uppercase',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        transition: 'background-color 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {h}
                                        {sortConfig.key === i && (
                                            <span style={{ color: 'var(--accent-primary)', fontSize: '1rem' }}>
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIdx) => (
                            <tr key={rowIdx} style={{ borderTop: '1px solid var(--border-color)' }}>
                                {row.map((cell, cellIdx) => (
                                    <td key={cellIdx} style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="card" style={{
            borderLeft: '4px solid var(--accent-primary)',
            padding: '2.5rem',
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            paddingLeft: 0, paddingRight: 0
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                        Strategic Output
                    </div>
                    <h3 style={{ fontSize: '1.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={28} className="text-secondary" />
                        {productName}
                    </h3>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'markdown' : 'grid')}
                        className="btn-primary"
                        style={{ backgroundColor: 'var(--bg-tertiary)', boxShadow: 'none' }}
                    >
                        {viewMode === 'grid' ? 'View Table' : 'View Cards'}
                    </button>

                    {cleanedTableData && (
                        <button
                            onClick={handleDownloadCsv}
                            className="btn-primary"
                            style={{ backgroundColor: 'var(--bg-tertiary)', boxShadow: 'none' }}
                        >
                            <Download size={18} /> CSV
                        </button>
                    )}
                </div>
            </div>

            {viewMode === 'grid' ? renderGrid() : renderTable()}
        </div>
    );
}

export default ResultView;
