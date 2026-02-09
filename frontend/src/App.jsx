import { useState } from 'react';
import Capture from './components/Capture';
import Confirmation from './components/Confirmation';
import Dashboard from './components/Dashboard';
import BudgetManager from './components/BudgetManager';
import CategorySettings from './components/CategorySettings';
import { PlusCircle, LayoutDashboard, Wallet, Settings } from 'lucide-react';

function App() {
    const [view, setView] = useState('capture'); // capture, confirm, success, dashboard, budgets, categories
    const [activeTab, setActiveTab] = useState('capture');
    const [extractedData, setExtractedData] = useState(null);

    const handleProcessed = (data) => {
        setExtractedData(data);
        setView('confirm');
    };

    const handleSuccess = () => {
        setView('success');
        setTimeout(() => {
            setExtractedData(null);
            setView('capture');
            setActiveTab('dashboard'); // Go to dashboard after success
        }, 2000);
    };

    const handleCancel = () => {
        setExtractedData(null);
        setView('capture');
    };

    const renderView = () => {
        if (view === 'confirm') {
            return (
                <Confirmation
                    data={extractedData}
                    onCancel={handleCancel}
                    onSuccess={handleSuccess}
                />
            );
        }

        if (view === 'success') {
            return (
                <div className="card fade-in" style={{
                    textAlign: 'center',
                    borderColor: 'var(--success)',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(30, 41, 59, 0.9))'
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                        animation: 'fadeIn 0.5s ease'
                    }}>
                        <PlusCircle size={48} />
                    </div>
                    <h2 style={{
                        color: 'var(--success)',
                        marginBottom: '0.5rem',
                        fontSize: '1.75rem',
                        fontWeight: '700'
                    }}>Success!</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                        Transaction saved successfully to your Google Sheet.
                    </p>
                </div>
            );
        }

        switch (activeTab) {
            case 'capture': return <Capture onProcessed={handleProcessed} />;
            case 'dashboard': return <Dashboard />;
            case 'budgets': return <BudgetManager />;
            case 'categories': return <CategorySettings />;
            default: return <Capture onProcessed={handleProcessed} />;
        }
    };

    return (
        <div className="app-container">
            <header>
                <h1>Antigravity Budget</h1>
                <nav className="tab-nav">
                    <button
                        className={activeTab === 'capture' ? 'active' : ''}
                        onClick={() => { setActiveTab('capture'); setView('capture'); }}
                    >
                        <PlusCircle size={20} />
                        <span>Capture</span>
                    </button>
                    <button
                        className={activeTab === 'dashboard' ? 'active' : ''}
                        onClick={() => { setActiveTab('dashboard'); setView('capture'); }}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={activeTab === 'budgets' ? 'active' : ''}
                        onClick={() => { setActiveTab('budgets'); setView('capture'); }}
                    >
                        <Wallet size={20} />
                        <span>Budgets</span>
                    </button>
                    <button
                        className={activeTab === 'categories' ? 'active' : ''}
                        onClick={() => { setActiveTab('categories'); setView('capture'); }}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </button>
                </nav>
            </header>

            <main className="content">
                {renderView()}
            </main>
        </div>
    );
}

export default App;
