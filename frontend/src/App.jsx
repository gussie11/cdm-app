import React, { useState } from 'react';
import StrategyForm from './components/StrategyForm';
import ResultView from './components/ResultView';
import axios from 'axios';
import { Map as MapIcon, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function App() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastProduct, setLastProduct] = useState("");

    const handleGenerate = async (formData) => {
        setLoading(true);
        setError(null);
        setResult(null);

        // Smooth scroll to results area if it exists, or just start loading
        try {
            const response = await axios.post(`${API_BASE_URL}/generate`, formData);
            setResult(response.data);
            setLastProduct(formData.product);
        } catch (err) {
            console.error(err);
            if (err.response) {
                // Server responded with a status code other than 2xx
                setError(err.response.data?.detail || `Server Error: ${err.response.status}`);
            } else if (err.request) {
                // Request was made but no response received
                setError("Network Error: Could not connect to backend. Is uvicorn running?");
            } else {
                setError(err.message || "An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header style={{ marginBottom: '3rem', marginTop: '1rem', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                    background: 'linear-gradient(to right, var(--bg-secondary), var(--bg-primary))',
                    padding: '1rem 2rem',
                    borderRadius: '2rem',
                    border: '1px solid var(--border-color)'
                }}>
                    <MapIcon size={32} color="var(--accent-primary)" />
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>
                        <span style={{ color: 'var(--text-primary)' }}>CDM</span>
                        <span style={{ color: 'var(--accent-primary)' }}>Generator</span>
                    </h1>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Strategic planning tool for B2B Enterprise buying cycles. Map decision obligations seamlessly.
                </p>
            </header>

            <main style={{ flex: 1, paddingBottom: '4rem' }}>
                <div className="card animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <StrategyForm onGenerate={handleGenerate} isLoading={loading} />

                    {error && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--error-color)',
                            borderRadius: '8px',
                            color: 'var(--error-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <AlertCircle size={20} />
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', marginTop: '4rem' }} className="animate-fade-in">
                        <Loader2 size={48} className="spin" style={{
                            animation: 'spin 1s linear infinite',
                            color: 'var(--accent-primary)'
                        }} />
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                            Generating strategic map with Gemini 2.0...
                        </p>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {result && (
                    <div className="animate-fade-in" style={{ marginTop: '3rem' }}>
                        <ResultView
                            markdownContent={result.markdown_content}
                            cleanedTableData={result.cleaned_table_data}
                            productName={lastProduct}
                        />
                    </div>
                )}
            </main>

            <footer style={{
                borderTop: '1px solid var(--border-color)',
                padding: '2rem 0',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
            }}>
                <p>&copy; {new Date().getFullYear()} Customer Decision Map Generator. Powered by Google Gemini.</p>
            </footer>
        </div>
    );
}

export default App;
