import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Landmark, Wallet, Plus, X, Server } from 'lucide-react';

function CategorySettings() {
    const [categories, setCategories] = useState({ expense: [], income: [], savings: [], vaults: [] });
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState({ type: '', value: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updated) => {
        try {
            await axios.post('/api/categories', updated);
            setCategories(updated);
        } catch (err) {
            console.error('Failed to save categories:', err);
        }
    };

    const addItem = (type) => {
        if (!newItem.value.trim()) return;
        const updated = { ...categories, [type]: [...categories[type], newItem.value.trim()] };
        handleSave(updated);
        setNewItem({ type: '', value: '' });
    };

    const deleteItem = (type, item) => {
        const updated = { ...categories, [type]: categories[type].filter(i => i !== item) };
        handleSave(updated);
    };

    if (loading) return <div className="card fade-in"><div className="spinner" /></div>;

    return (
        <div className="fade-in">
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h2>Settings</h2>
                <p className="label">Manage your categories and vault locations.</p>
            </div>

            <CategorySection
                title="Expense Categories"
                type="expense"
                icon={Tag}
                color="var(--error)"
                items={categories.expense}
                newItem={newItem}
                onUpdateNewItem={setNewItem}
                onAdd={addItem}
                onDelete={deleteItem}
            />
            <CategorySection
                title="Income Sources"
                type="income"
                icon={Wallet}
                color="var(--success)"
                items={categories.income}
                newItem={newItem}
                onUpdateNewItem={setNewItem}
                onAdd={addItem}
                onDelete={deleteItem}
            />
            <CategorySection
                title="Savings Types"
                type="savings"
                icon={Landmark}
                color="var(--primary)"
                items={categories.savings}
                newItem={newItem}
                onUpdateNewItem={setNewItem}
                onAdd={addItem}
                onDelete={deleteItem}
            />
            <CategorySection
                title="Vault Locations"
                type="vaults"
                icon={Server}
                color="#6366f1"
                items={categories.vaults}
                newItem={newItem}
                onUpdateNewItem={setNewItem}
                onAdd={addItem}
                onDelete={deleteItem}
            />
        </div>
    );
}

const CategorySection = ({ title, type, icon: Icon, color, items, newItem, onUpdateNewItem, onAdd, onDelete }) => (
    <div className="card" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.02)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color }}>
            <Icon size={20} /> {title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', margin: '1rem 0' }}>
            {items.map(item => (
                <span key={item} className="tag" style={{ border: `1px solid ${color}44` }}>
                    {item}
                    <button
                        onClick={() => onDelete(type, item)}
                        style={{ background: 'none', border: 'none', padding: '2px', marginLeft: '5px', color: 'var(--text-muted)', cursor: 'pointer', display: 'inline-flex' }}
                    >
                        <X size={14} />
                    </button>
                </span>
            ))}
        </div>

        <div className="form-row" style={{ gap: '0.5rem' }}>
            <input
                type="text"
                placeholder={`New ${title.toLowerCase()}...`}
                value={newItem.type === type ? newItem.value : ''}
                onChange={e => onUpdateNewItem({ type, value: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && onAdd(type)} // Added Enter key support
                style={{ margin: 0 }}
            />
            <button
                onClick={() => onAdd(type)}
                className="secondary"
                style={{ width: 'auto', padding: '0.5rem' }}
                disabled={newItem.type !== type || !newItem.value.trim()}
            >
                <Plus size={18} />
            </button>
        </div>
    </div>
);

export default CategorySettings;
