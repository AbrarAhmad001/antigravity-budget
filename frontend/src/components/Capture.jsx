import { useState } from 'react';
import axios from 'axios';
import { Image as ImageIcon, Type, Upload, X } from 'lucide-react';

const Capture = ({ onProcessed }) => {
    const [activeTab, setActiveTab] = useState('text');
    const [loading, setLoading] = useState(false);
    const [textInput, setTextInput] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState('');

    const handleTextSubmit = async () => {
        if (!textInput.trim()) return;
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('text', textInput);
            const res = await axios.post('/api/process/text', formData);
            onProcessed(res.data.extracted);
        } catch (err) {
            setError('Failed to process text: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleImageSubmit = async () => {
        if (!imageFile) return;
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', imageFile);
            const res = await axios.post('/api/process/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onProcessed(res.data.extracted);
        } catch (err) {
            setError('Failed to process image: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card fade-in">
            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === 'text' ? 'active' : ''}`} onClick={() => setActiveTab('text')}>
                    <Type size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Text
                </button>
                <button className={`tab ${activeTab === 'image' ? 'active' : ''}`} onClick={() => setActiveTab('image')}>
                    <ImageIcon size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Image
                </button>
            </div>

            {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}

            {/* Content */}
            <div className="content">

                {/* TEXT INPUT */}
                {activeTab === 'text' && (
                    <div className="fade-in">
                        <textarea
                            rows={4}
                            placeholder="e.g. Lunch 500 BDT from Bkash. Saved 2000 in emergency fund from income."
                            value={textInput}
                            onChange={e => setTextInput(e.target.value)}
                        />
                        <button onClick={handleTextSubmit} disabled={loading}>
                            {loading ? <div className="spinner" /> : 'Process Text'}
                        </button>
                    </div>
                )}

                {/* IMAGE INPUT */}
                {activeTab === 'image' && (
                    <div className="fade-in">
                        <div
                            style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '2rem', textAlign: 'center', marginBottom: '1rem', cursor: 'pointer' }}
                            onClick={() => document.getElementById('image-upload').click()}
                        >
                            <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                            <p className="label">Click to Upload Receipt</p>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                        </div>

                        {imageFile && (
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="label" style={{ margin: 0 }}>{imageFile.name}</span>
                                <button
                                    className="secondary"
                                    style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    onClick={() => setImageFile(null)}
                                >
                                    <X size={14} /> Remove
                                </button>
                            </div>
                        )}

                        <button onClick={handleImageSubmit} disabled={loading || !imageFile}>
                            {loading ? <div className="spinner" /> : 'Process Image'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Capture;
