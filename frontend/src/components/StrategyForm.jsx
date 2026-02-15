import React, { useState, useEffect, useRef } from 'react';
import { Target, Users, Layers, Zap, CheckCircle2, HelpCircle, Map, Search, Building2, Briefcase, Loader2 } from 'lucide-react';
import LifecycleMap from './LifecycleMap';
import axios from 'axios';
import '../entity_search.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const SCOPE_OPTIONS = {
    "1. Strategic Overview": ["Full Map (0-9)"],
    "2. Phased Lifecycle": [
        "First Order (0-3)",
        "Order to Use (3-4)",
        "Use & Assess (4 & 6)",
        "Renew / Expand (7-9)"
    ],
    "3. Deep Dive (Granular)": [
        "Aware-Source (0-1)",
        "Source-Select (1-2)",
        "Select-Order (2-3)",
        "Order-Use (3-4)",
        "Order-Assess (4-6)",
        "Assess-Renew (6-7)",
        "Assess-Add (6-8)",
        "Assess-Expand (6-9)"
    ]
};

const PROMPT_KEYS = {
    "Full Map (0-9)": "full",
    "First Order (0-3)": "phase_1",
    "Order to Use (3-4)": "phase_2",
    "Use & Assess (4 & 6)": "phase_3",
    "Renew / Expand (7-9)": "phase_4",
    "Aware-Source (0-1)": "detail_0_1",
    "Source-Select (1-2)": "detail_1_2",
    "Select-Order (2-3)": "detail_2_3",
    "Order-Use (3-4)": "detail_3_4",
    "Order-Assess (4-6)": "detail_4_6",
    "Assess-Renew (6-7)": "detail_6_7",
    "Assess-Add (6-8)": "detail_6_8",
    "Assess-Expand (6-9)": "detail_6_9"
};

const RUBIE_OPTIONS = []; // No longer needed in form

function StrategyForm({ onGenerate, isLoading }) {
    const [product, setProduct] = useState("");
    const [industry, setIndustry] = useState("");
    const [scopeCategory, setScopeCategory] = useState("1. Strategic Overview");
    const [showAiQ, setShowAiQ] = useState(true);
    const [showCustomerThinking, setShowCustomerThinking] = useState(true);
    const [showSalesQuestion, setShowSalesQuestion] = useState(true);
    const [touched, setTouched] = useState({});

    // Step Logic
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedEntity, setSelectedEntity] = useState(null);

    // Search State
    const [specificView, setSpecificView] = useState(SCOPE_OPTIONS["1. Strategic Overview"][0]);
    const [entityResults, setEntityResults] = useState([]);
    const [isSearchingEntity, setIsSearchingEntity] = useState(false);
    const [showEntityResults, setShowEntityResults] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (industry.length > 2 && showEntityResults) {
                handleEntitySearch(industry);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [industry]);

    const handleEntitySearch = async (query) => {
        setIsSearchingEntity(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/search_entity`, { query });
            setEntityResults(res.data.matches || []);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearchingEntity(false);
        }
    };

    const selectEntity = (match) => {
        setIndustry(match.name);
        setSelectedEntity(match); // Store full object for confirmation
        setEntityResults([]);
        setShowEntityResults(false);
        setCurrentStep(2); // Automatically advance
    };

    const handleBack = () => {
        setCurrentStep(1);
        setEntityResults([]); // Clear results on back
    };

    // Update specific view when category changes
    useEffect(() => {
        setSpecificView(SCOPE_OPTIONS[scopeCategory][0]);
    }, [scopeCategory]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        const newTouched = { product: true, industry: true, scope: true };
        setTouched(newTouched);

        if (product && industry) {
            onGenerate({
                product,
                industry,
                rubie_pov: [], // Always fetch all
                scope_key: PROMPT_KEYS[specificView],
                show_ai_q: showAiQ,
                show_customer_thinking: showCustomerThinking,
                show_sales_question: showSalesQuestion
            });
        }
    };

    const isInvalid = (field) => {
        const values = { product, industry };
        return touched[field] && !values[field]?.trim();
    };

    return (
        <form onSubmit={handleSubmit}>


            {/* STEP 1: Entity Search & Selection */}
            {currentStep === 1 && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>Let's start mapping.</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Who is the target customer or industry for this decision map?
                    </p>

                    <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
                        <div className="input-group entity-search-container">
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Type Company (e.g. Oracle) or Industry (e.g. SaaS)"
                                    value={industry}
                                    onChange={(e) => {
                                        setIndustry(e.target.value);
                                        setShowEntityResults(true);
                                    }}
                                    autoComplete="off"
                                    autoFocus
                                    style={{ padding: '1rem', fontSize: '1.1rem', paddingRight: '40px' }}
                                />
                                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                                    {isSearchingEntity ? <Loader2 className="spin" size={24} /> : <Search size={24} />}
                                </div>
                            </div>

                            {/* Search Results Cards */}
                            {showEntityResults && entityResults.length > 0 && (
                                <div className="entity-results-list" style={{ gridTemplateColumns: '1fr' }}>
                                    {entityResults.map((match, idx) => (
                                        <div
                                            key={idx}
                                            className="entity-card"
                                            onClick={() => selectEntity(match)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                                        >
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '50%' }}>
                                                {match.type === 'Company' ? <Briefcase size={20} /> : <Building2 size={20} />}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{match.name}</h4>
                                                <p className="entity-desc">{match.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: Configuration */}
            {currentStep === 2 && (
                <div className="animate-fade-in">

                    {/* Confirmation Header */}
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid var(--accent-glow)',
                        borderRadius: '12px',
                        padding: '1rem 1.5rem',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '50%', color: 'white' }}>
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Selected Target
                                </div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    {selectedEntity ? selectedEntity.name : industry}
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleBack}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                padding: '0.5rem 1rem',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Change
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* 1. Product Context */}
                        <div>
                            <h3 className="section-title">
                                <Target size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                                1. Product Context
                            </h3>
                            <div className="input-group">
                                <label className="label-text">Product or Service *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g., Enterprise CRM Platform"
                                    value={product}
                                    onChange={(e) => setProduct(e.target.value)}
                                    onBlur={() => setTouched(p => ({ ...p, product: true }))}
                                    style={isInvalid('product') ? { borderColor: 'var(--error-color)' } : {}}
                                />
                                {isInvalid('product') && <span style={{ color: 'var(--error-color)', fontSize: '0.8rem' }}>Required</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {currentStep === 2 && (
                <>
                    <hr style={{ borderColor: 'var(--border-color)', margin: '2rem 0', opacity: 0.5 }} />

                    {/* Visual Lifecycle Link */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 className="section-title">
                            <Map size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                            Decision Lifecycle Map
                        </h3>
                        <LifecycleMap currentView={specificView} />
                    </div>

                    {/* Scope Selection */}
                    <h3 className="section-title">
                        <Layers size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                        Scope & Configuration
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label-text">3. Select Scope Level</label>
                            <select className="input-field" value={scopeCategory} onChange={(e) => setScopeCategory(e.target.value)}>
                                {Object.keys(SCOPE_OPTIONS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0 }}>
                            <label className="label-text">4. Select Specific View</label>
                            <select className="input-field" value={specificView} onChange={(e) => setSpecificView(e.target.value)}>
                                {SCOPE_OPTIONS[scopeCategory].map(view => <option key={view} value={view}>{view}</option>)}
                            </select>
                        </div>

                        <div className="input-group" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="label-text" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={showAiQ}
                                    onChange={(e) => setShowAiQ(e.target.checked)}
                                    style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.75rem', accentColor: 'var(--accent-primary)' }}
                                />
                                Include AI Questions
                            </label>
                            <label className="label-text" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={showCustomerThinking}
                                    onChange={(e) => setShowCustomerThinking(e.target.checked)}
                                    style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.75rem', accentColor: 'var(--accent-primary)' }}
                                />
                                Include Customer Thinking
                            </label>
                            <label className="label-text" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={showSalesQuestion}
                                    onChange={(e) => setShowSalesQuestion(e.target.checked)}
                                    style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.75rem', accentColor: 'var(--accent-primary)' }}
                                />
                                Include Sales Questions
                            </label>
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                fontSize: '1.1rem',
                                padding: '1rem'
                            }}
                        >
                            {isLoading ? (
                                <>Generating Strategy...</>
                            ) : (
                                <><Zap size={20} fill="currentColor" /> Generate Decision Strategy</>
                            )}
                        </button>
                    </div>
                </>
            )}
        </form >


    );
}

export default StrategyForm;
