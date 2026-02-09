import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, Calendar, DollarSign, Tag, FileText, Trash2, MapPin, Info, Clock } from 'lucide-react';

const Confirmation = ({ data, onCancel, onSuccess }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState({
        expense: [], income: [], savings: [], vaults: []
    });

    useEffect(() => {
        if (data && Array.isArray(data)) {
            setTransactions(data);
        }
        fetchCategories();
    }, [data]);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

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
                amount: parseFloat(t.amount || 0),
                vault_location: t.vault_location || 'Other',
                detail_source_item: t.detail_source_item || t.description || '',
                transaction_type: t.transaction_type || t.type || 'expense'
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

            <div style={{ maxHeight: '600px', overflowY: 'auto', marginBottom: '1.5rem', paddingRight: '0.5rem' }}>
                {transactions.map((txn, index) => {
                    const type = txn.transaction_type || txn.type || 'expense';
                    let catList = categories[type] || [];

                    // Allow selecting Savings categories for Expense type (spending from funds)
                    if (type === 'expense') {
                        catList = [...catList, ...(categories.savings || [])];
                    }

                    return (
                        <div key={index} className="card" style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(30, 41, 59, 0.5))',
                            padding: '1.5rem',
                            marginBottom: '1rem',
                            position: 'relative',
                            borderStyle: 'solid',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                            borderWidth: '1px'
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
                                    background: 'var(--error)',
                                    borderColor: 'var(--error)'
                                }}
                                onClick={() => handleDelete(index)}
                            >
                                <Trash2 size={14} /> Delete
                            </button>

                            <div className="form-group">
                                <label className="label">Transaction Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => handleChange(index, 'transaction_type', e.target.value)}
                                    style={{ borderLeft: '4px solid var(--primary)' }}
                                >
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                    <option value="savings">Savings</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label"><Calendar size={14} /> Date</label>
                                    <input
                                        type="date"
                                        value={txn.date}
                                        onChange={(e) => handleChange(index, 'date', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label"><Clock size={14} /> Time</label>
                                    <input
                                        type="time"
                                        value={txn.time || ''}
                                        onChange={(e) => handleChange(index, 'time', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label"><DollarSign size={14} /> Amount</label>
                                    <input
                                        type="number"
                                        value={txn.amount}
                                        onChange={(e) => handleChange(index, 'amount', e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label"><MapPin size={14} /> Vault</label>
                                    <select
                                        value={txn.vault_location || 'Other'}
                                        onChange={(e) => handleChange(index, 'vault_location', e.target.value)}
                                    >
                                        {categories.vaults.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label"><Tag size={14} /> Category</label>
                                <select
                                    value={txn.category}
                                    onChange={(e) => handleChange(index, 'category', e.target.value)}
                                >
                                    <option value="">Select Category</option>
                                    {catList.map(c => <option key={c} value={c}>{c}</option>)}
                                    {!catList.includes(txn.category) && txn.category && <option value={txn.category}>{txn.category}</option>}
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="label"><Info size={14} /> {type === 'expense' ? 'Bought/Lent To' : 'Source'}</label>
                                <input
                                    type="text"
                                    placeholder={type === 'expense' ? 'e.g., Taxi, John' : 'e.g., Job, Income'}
                                    value={txn.detail_source_item || ''}
                                    onChange={(e) => handleChange(index, 'detail_source_item', e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label"><FileText size={14} /> Description</label>
                                <textarea
                                    rows="2"
                                    value={txn.description || ''}
                                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            {type === 'savings' && (
                                <div className="form-row" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px' }}>
                                    <div className="form-group">
                                        <label className="label">Spent Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={txn.secondary_date || ''}
                                            onChange={(e) => handleChange(index, 'secondary_date', e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="label">Spent Time (Optional)</label>
                                        <input
                                            type="time"
                                            value={txn.secondary_time || ''}
                                            onChange={(e) => handleChange(index, 'secondary_time', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <button onClick={handleSubmit} disabled={loading} style={{ background: 'linear-gradient(135deg, #10b981, #059669)', height: '50px', fontSize: '1.1rem' }}>
                {loading ? <div className="spinner" /> : <><Check size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Confirm & Save to Sheets</>}
            </button>
        </div>
    );
};

export default Confirmation;
