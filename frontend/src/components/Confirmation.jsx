import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Calendar, DollarSign, Tag, FileText, Trash2 } from 'lucide-react';

const Confirmation = ({ data, onCancel, onSuccess }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (data && Array.isArray(data)) {
            setTransactions(data);
        }
    }, [data]);

    const handleChange = (index, field, value) => {
        const updated = [...transactions];
        updated[index] = { ...updated[index], [field]: value };
        setTransactions(updated);
    };

    const handleDelete = (index) => {
        const updated = transactions.filter((_, i) => i !== index);
        setTransactions(updated);
    };

    const handleSubmit = async () => {
        if (transactions.length === 0) {
            setError('No transactions to save');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const payload = transactions.map(t => ({
                ...t,
                amount: parseFloat(t.amount)
            }));
            await axios.post('/api/confirm', payload);
            onSuccess();
        } catch (err) {
            setError('Failed to save transactions: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (transactions.length === 0) {
        return (
            <div className="card fade-in" style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>No transactions extracted. Please try again.</p>
                <button className="secondary" onClick={onCancel} style={{ marginTop: '1rem' }}>Back</button>
            </div>
        );
    }

    return (
        <div className="card fade-in">
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Confirm Transactions ({transactions.length})
                <button className="secondary" style={{ width: 'auto', padding: '0.5rem' }} onClick={onCancel}>
                    <X size={20} />
                </button>
            </h2>

            {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '1rem' }}>
                {transactions.map((txn, index) => (
                    <div key={index} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: '1rem',
                        marginBottom: '1rem',
                        position: 'relative'
                    }}>
                        <button
                            className="secondary"
                            style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                width: 'auto',
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.8rem',
                                background: 'var(--error)'
                            }}
                            onClick={() => handleDelete(index)}
                        >
                            <Trash2 size={14} /> Delete
                        </button>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <label className="label"><Calendar size={14} style={{ marginRight: 4 }} /> Date</label>
                            <input
                                type="date"
                                value={txn.date}
                                onChange={(e) => handleChange(index, 'date', e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <label className="label"><DollarSign size={14} style={{ marginRight: 4 }} /> Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                value={txn.amount}
                                onChange={(e) => handleChange(index, 'amount', e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <label className="label"><Tag size={14} style={{ marginRight: 4 }} /> Category</label>
                            <input
                                type="text"
                                value={txn.category}
                                onChange={(e) => handleChange(index, 'category', e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <label className="label"><FileText size={14} style={{ marginRight: 4 }} /> Description</label>
                            <input
                                type="text"
                                value={txn.description}
                                onChange={(e) => handleChange(index, 'description', e.target.value)}
                                style={{ marginBottom: 0 }}
                            />
                        </div>

                        <div>
                            <label className="label">Type</label>
                            <select
                                value={txn.type}
                                onChange={(e) => handleChange(index, 'type', e.target.value)}
                                style={{ marginBottom: 0 }}
                            >
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ background: 'var(--success)' }}>
                {loading ? <div className="spinner" /> : <><Check size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Save All to Google Sheets</>}
            </button>
        </div>
    );
};

export default Confirmation;
