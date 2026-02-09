import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Landmark, Wallet } from 'lucide-react';

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [overallSavings, setOverallSavings] = useState(null);

    useEffect(() => {
        fetchAvailableYears();
        fetchOverallSavings();
    }, []);

    const fetchOverallSavings = async () => {
        try {
            const res = await axios.get('/api/analytics/overall-savings');
            setOverallSavings(res.data);
        } catch (err) {
            console.error('Failed to fetch overall savings:', err);
        }
    };

    const fetchAvailableYears = async () => {
        try {
            const response = await axios.get('/api/summary/available-years');
            const years = response.data.years || [];
            setAvailableYears(years);
            // Set current year if it exists in available years, otherwise use the latest
            if (years.length > 0) {
                const currentYear = new Date().getFullYear();
                setYear(years.includes(currentYear) ? currentYear : years[years.length - 1]);
            }
        } catch (err) {
            console.error('Failed to fetch available years:', err);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const summaryRes = await axios.get(`/api/summary/monthly?month=${month}&year=${year}`);
            setSummary(summaryRes.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        fetchDashboardData();
    };

    return (
        <div className="fade-in">
            {/* Overall Savings Section (Standalone) */}
            {overallSavings && (
                <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)' }}>
                    <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>All-Time Savings</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <p className="label">Total Available Savings</p>
                            <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)' }}>
                                {overallSavings.total_overall_savings.toFixed(2)}
                            </div>
                        </div>

                        {overallSavings.savings_breakdown && Object.keys(overallSavings.savings_breakdown).length > 0 && (
                            <div style={{ height: '250px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(overallSavings.savings_breakdown).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value.toFixed(0)}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {Object.keys(overallSavings.savings_breakdown).map((_, index, arr) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 60}, 80%, 60%)`} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'white' }}
                                            itemStyle={{ color: 'white' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Monthly Summary</h2>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={{ margin: 0 }}>
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </option>
                            ))}
                        </select>
                        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ margin: 0 }}>
                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <button onClick={handleGenerate} disabled={loading} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                            {loading ? 'Loading...' : 'Generate'}
                        </button>
                    </div>
                </div>

                {summary && (
                    <div className="dashboard-grid">
                        <div className="card stat-card" style={{ borderColor: 'var(--success)' }}>
                            <ArrowUpCircle size={24} color="var(--success)" style={{ margin: '0 auto' }} />
                            <p className="label">Income</p>
                            <div className="stat-value" style={{ color: 'var(--success)' }}>{summary?.total_income?.toFixed(2)}</div>
                        </div>
                        <div className="card stat-card" style={{ borderColor: 'var(--error)' }}>
                            <ArrowDownCircle size={24} color="var(--error)" style={{ margin: '0 auto' }} />
                            <p className="label">Expense</p>
                            <div className="stat-value" style={{ color: 'var(--error)' }}>{summary?.total_expense?.toFixed(2)}</div>
                        </div>
                        <div className="card stat-card" style={{ borderColor: 'var(--primary)' }}>
                            <Landmark size={24} color="var(--primary)" style={{ margin: '0 auto' }} />
                            <p className="label">Savings</p>
                            <div className="stat-value" style={{ color: 'var(--primary)' }}>{summary?.total_savings?.toFixed(2)}</div>
                        </div>
                        <div className="card stat-card" style={{ borderColor: summary?.net_balance >= 0 ? '#6366f1' : 'var(--error)' }}>
                            <Wallet size={24} color={summary?.net_balance >= 0 ? '#6366f1' : 'var(--error)'} style={{ margin: '0 auto' }} />
                            <p className="label">Net Balance</p>
                            <div className="stat-value" style={{ color: summary?.net_balance >= 0 ? '#6366f1' : 'var(--error)' }}>
                                {summary?.net_balance?.toFixed(2)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pie Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {/* Income vs Expense (including Savings) Pie Chart with Ratio */}
                {summary && (summary.total_income > 0 || summary.total_expense > 0 || summary.total_savings > 0) && (
                    <div className="card">
                        <h3>Income vs Expense</h3>
                        {(() => {
                            const income = summary.total_income || 0;
                            const totalExpense = (summary.total_expense || 0) + (summary.total_savings || 0);

                            // Calculate ratio
                            const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
                            const totalSum = income + (summary.total_expense || 0) + (summary.total_savings || 0);

                            let ratio = '';
                            if (totalSum > 0) {
                                const incomeRatio = Math.round(income);
                                const expenseRatio = Math.round(summary.total_expense || 0);
                                const savingsRatio = Math.round(summary.total_savings || 0);

                                const divisor = gcd(gcd(incomeRatio, expenseRatio), savingsRatio) || 1;
                                ratio = `${Math.round(incomeRatio / divisor)}:${Math.round(expenseRatio / divisor)}:${Math.round(savingsRatio / divisor)}`;
                            }

                            return (
                                <>
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        Ratio (Income:Expense:Savings) = {ratio}
                                    </p>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Income', value: income },
                                                        { name: 'Expense + Savings', value: totalExpense }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    <Cell fill="var(--success)" />
                                                    <Cell fill="var(--error)" />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'white' }}
                                                    itemStyle={{ color: 'white' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* Expense Categories (including Savings) Breakdown */}
                {summary && (() => {
                    const combinedBreakdown = { ...(summary.expense_breakdown || {}), ...(summary.savings_breakdown || {}) };
                    return Object.keys(combinedBreakdown).length > 0;
                })() && (
                        <div className="card">
                            <h3>Expense Categories</h3>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries({ ...(summary.expense_breakdown || {}), ...(summary.savings_breakdown || {}) }).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {Object.keys({ ...(summary.expense_breakdown || {}), ...(summary.savings_breakdown || {}) }).map((_, index, arr) => (
                                                <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / arr.length}, 70%, 50%)`} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'white' }}
                                            itemStyle={{ color: 'white' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                {/* Income Categories Breakdown */}
                {summary && summary.income_breakdown && Object.keys(summary.income_breakdown).length > 0 && (
                    <div className="card">
                        <h3>Income Categories</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(summary.income_breakdown).map(([name, value]) => ({ name, value }))}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {Object.keys(summary.income_breakdown).map((_, index, arr) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(${120 + index * 360 / arr.length}, 70%, 50%)`} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'white' }}
                                        itemStyle={{ color: 'white' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Savings Categories Pie Chart (Moved to Bottom) */}
                {summary && summary.savings_breakdown && Object.keys(summary.savings_breakdown).length > 0 && (
                    <div className="card">
                        <h3>Savings Categories</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(summary.savings_breakdown).map(([name, value]) => ({ name, value }))}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value.toFixed(2)}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {Object.keys(summary.savings_breakdown).map((_, index, arr) => (
                                            <Cell key={`cell-${index}`} fill={`hsl(${200 + index * 360 / arr.length}, 70%, 50%)`} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ background: 'var(--card-bg)', borderColor: 'var(--border)', color: 'white' }}
                                        itemStyle={{ color: 'white' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
