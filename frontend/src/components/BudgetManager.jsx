import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, AlertTriangle, TrendingUp, PiggyBank } from 'lucide-react';

function BudgetManager() {
    const [allBudgets, setAllBudgets] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [categories, setCategories] = useState([]);

    // View State
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [newBudget, setNewBudget] = useState({ category: '', amount: '', threshold: 0.8 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAvailableYears();
        fetchCategories();
        fetchAllBudgets();
    }, []);

    // Fetch alerts whenever month/year changes
    useEffect(() => {
        fetchAlerts();
    }, [month, year]);

    const fetchAvailableYears = async () => {
        try {
            const response = await axios.get('/api/summary/available-years');
            const years = response.data.years || [];
            setAvailableYears(years);
            if (years.length > 0) {
                const currentYear = new Date().getFullYear();
                setYear(years.includes(currentYear) ? currentYear : years[years.length - 1]);
            }
        } catch (err) { console.error('Failed to fetch years:', err); }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories([...res.data.expense, ...res.data.savings]);
        } catch (err) { console.error('Failed to categories:', err); }
    };

    const fetchAllBudgets = async () => {
        try {
            const res = await axios.get('/api/budgets');
            setAllBudgets(res.data);
        } catch (err) { console.error('Failed to fetch budgets:', err); }
    };

    const fetchAlerts = async () => {
        try {
            const res = await axios.get(`/api/alerts?month=${month}&year=${year}`);
            setAlerts(res.data);
        } catch (err) { console.error('Failed to fetch alerts:', err); }
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/budgets', {
                ...newBudget,
                amount: parseFloat(newBudget.amount),
                month: month,
                year: year
            });
            setShowForm(false);
            setNewBudget({ category: '', amount: '', threshold: 0.8 });
            // Refresh
            fetchAllBudgets();
            fetchAlerts();
        } catch (err) {
            console.error('Failed to add budget:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBudget = async (id, category) => {
        if (!window.confirm(`Delete budget for ${category}?`)) return;
        setLoading(true);
        try {
            // CRITCAL: Using ID based deletion
            await axios.delete(`/api/budgets/${id}`);
            fetchAllBudgets();
            fetchAlerts();
        } catch (err) {
            console.error('Failed to delete budget:', err);
            alert('Failed to delete budget. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    // Filter budgets for current view
    const currentMonthBudgets = allBudgets.filter(b => b.month === month && b.year === year);

    return (
        <div className="fade-in">
            {/* Header / Controls */}
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ margin: 0 }}>Budget Manager</h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ width: 'auto' }}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ width: 'auto' }}>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--primary)', width: 'auto' }}>
                        {showForm ? 'Cancel' : <><Plus size={18} /> Add Budget</>}
                    </button>
                    <button onClick={fetchAlerts} style={{ width: 'auto' }} disabled={loading}>
                        Refresh Status
                    </button>
                </div>
            </div>

            {/* Add Budget Form */}
            {showForm && (
                <form onSubmit={handleAddBudget} className="card slide-down" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary)' }}>
                    <h3>Add Budget for {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Category</label>
                            <select value={newBudget.category} onChange={e => setNewBudget({ ...newBudget, category: e.target.value })} required>
                                <option value="">Select...</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="label">Limit / Goal</label>
                            <input type="number" value={newBudget.amount} onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })} required />
                        </div>
                    </div>
                    <button type="submit" disabled={loading}>Save Budget</button>
                </form>
            )}

            {/* Current Month Status */}
            <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <h3>Status: {new Date(0, month - 1).toLocaleString('default', { month: 'long' })} {year}</h3>
                    {currentMonthBudgets.length === 0 ? (
                        <p className="label">No budgets set for this month.</p>
                    ) : (
                        <div className="budget-list">
                            {currentMonthBudgets.map(b => {
                                const alert = alerts.find(a => a.category === b.category);
                                const spent = alert ? alert.spent : 0;
                                const percent = (spent / b.amount) * 100;
                                const isExpense = alert ? alert.type === 'expense' : true;
                                const status = alert ? alert.status : 'normal';

                                let color = 'var(--success)';
                                if (isExpense) {
                                    if (status === 'critical') color = 'var(--error)';
                                    else if (status === 'warning') color = '#f59e0b';
                                } else {
                                    if (status === 'success') color = '#3b82f6';
                                }

                                return (
                                    <div key={b.id || Math.random()} style={{ marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <strong>{b.category}</strong>
                                                {alert?.msg && <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${color}`, color }}>{alert.msg}</span>}
                                            </div>
                                            <span>{spent.toFixed(0)} / {b.amount}</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: color, transition: 'width 0.3s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* All Budgets List (Management) */}
            <div className="card">
                <h3>All Configured Budgets</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '0.5rem' }}>Category</th>
                                <th style={{ padding: '0.5rem' }}>Period</th>
                                <th style={{ padding: '0.5rem' }}>Limit</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allBudgets.map(b => {
                                const period = (b.month && b.year)
                                    ? `${new Date(0, b.month - 1).toLocaleString('default', { month: 'short' })} ${b.year}`
                                    : 'Recurring / Global';

                                return (
                                    <tr key={b.id || Math.random()} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem', textTransform: 'capitalize' }}>{b.category}</td>
                                        <td style={{ padding: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{period}</td>
                                        <td style={{ padding: '0.5rem' }}>{b.amount}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteBudget(b.id, b.category)}
                                                className="secondary"
                                                style={{ color: 'var(--error)', borderColor: 'var(--error)', padding: '4px 8px' }}
                                                title="Delete Budget"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default BudgetManager;
