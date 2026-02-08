import { useState } from 'react';
import Capture from './components/Capture';
import Confirmation from './components/Confirmation';
import { PlusCircle } from 'lucide-react';

function App() {
    const [view, setView] = useState('capture'); // capture, confirm, success
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
        }, 3000);
    };

    const handleCancel = () => {
        setExtractedData(null);
        setView('capture');
    };

    return (
        <>
            <h1>Antigravity Budget</h1>

            {view === 'capture' && (
                <Capture onProcessed={handleProcessed} />
            )}

            {view === 'confirm' && (
                <Confirmation
                    data={extractedData}
                    onCancel={handleCancel}
                    onSuccess={handleSuccess}
                />
            )}

            {view === 'success' && (
                <div className="card fade-in" style={{ textAlign: 'center', borderColor: 'var(--success)' }}>
                    <div style={{
                        width: 80, height: 80,
                        borderRadius: '50%',
                        background: 'var(--success)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <PlusCircle size={48} />
                    </div>
                    <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Success!</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Transaction saved to Google Sheets.</p>
                </div>
            )}
        </>
    );
}

export default App;
