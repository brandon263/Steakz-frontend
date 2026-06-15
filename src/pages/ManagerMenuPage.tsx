import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

interface MenuItem { id: number; name: string; description?: string; price: number; category: string; isAvailable: boolean }

export default function ManagerMenuPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [form, setForm] = useState({ name: '', description: '', price: 0, category: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', price: 0 });

  useEffect(() => {
    if (!user?.branchId) return;
    api.get(`/menu/${user.branchId}`).then((r: any) => setItems(r.data)).catch(() => setItems([]));
  }, [user?.branchId]);

  function handleCreate(e: any) {
    e.preventDefault();
    api.post('/menu/', form).then((r: any) => {
      setItems(prev => [r.data, ...prev]);
      setForm({ name: '', description: '', price: 0, category: '' });
    }).catch((err: any) => console.error(err));
  }

  function handleDelete(id: number) {
    if (!confirm('Delete this menu item?')) return;
    api.delete(`/menu/${id}`).then(() => setItems(prev => prev.filter(i => i.id !== id))).catch((e:any)=>console.error(e));
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditForm({ name: item.name, description: item.description ?? '', price: item.price });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ name: '', description: '', price: 0 });
  }

  function saveEdit(id: number) {
    const data: any = { name: editForm.name, description: editForm.description, price: editForm.price };
    api.patch(`/menu/${id}`, data).then((r: any) => {
      setItems(prev => prev.map(i => i.id === id ? r.data : i));
      cancelEdit();
    }).catch((e: any) => console.error(e));
  }

  return (
    <div className="page">
      <h1>Manage Menu</h1>

      <form onSubmit={handleCreate} style={{ marginBottom: '1.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '.5rem' }}>
        <input placeholder="Type here..." value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} required />
        <input placeholder="Type here..." value={form.category} onChange={e=>setForm(f=>({ ...f, category: e.target.value }))} required />
        <input type="number" step="0.01" placeholder="0" value={form.price || ''} onChange={e=>setForm(f=>({ ...f, price: parseFloat(e.target.value) }))} required />
        <button className="btn btn-primary">Add</button>
        <input placeholder="Type here..." value={form.description} onChange={e=>setForm(f=>({ ...f, description: e.target.value }))} style={{ gridColumn: '1 / -1' }} />
      </form>

      <div className="card-grid">
        {items.map(i => (
          <div className="card" key={i.id} style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{i.name}</strong>
              <span>${i.price.toFixed(2)}</span>
            </div>
            <div style={{ color: 'var(--text-muted)' }}>{i.description}</div>
            {editingId === i.id ? (
              <div style={{ display: 'flex', gap: '.5rem', flexDirection: 'column' }}>
                <input value={editForm.name} onChange={e=>setEditForm(f=>({...f, name: e.target.value}))} />
                <input value={editForm.description} onChange={e=>setEditForm(f=>({...f, description: e.target.value}))} />
                <input type="number" step="0.01" value={String(editForm.price)} onChange={e=>setEditForm(f=>({...f, price: parseFloat(e.target.value)}))} />
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={()=>saveEdit(i.id)}>Save</button>
                  <button className="btn btn-outline btn-sm" onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button className="btn btn-outline btn-sm" onClick={()=>startEdit(i)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(i.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
