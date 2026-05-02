'use client';
import { useEffect, useState } from 'react';
import { api, Member } from '@/lib/api';
import { formatCRC, formatPhone } from '@/lib/utils';
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';

const EMPTY_FORM = {
  fullName: '', phoneNumber: '', email: '', monthlyAmount: '', dueDay: '1', notes: '',
};

function MemberModal({
  member, onClose, onSave,
}: {
  member?: Member;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState(member ? {
    fullName: member.fullName,
    phoneNumber: member.phoneNumber,
    email: member.email ?? '',
    monthlyAmount: String(member.monthlyAmount),
    dueDay: String(member.dueDay),
    notes: member.notes ?? '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const dto = {
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        monthlyAmount: parseFloat(form.monthlyAmount),
        dueDay: parseInt(form.dueDay),
        notes: form.notes.trim() || undefined,
      };
      if (member) {
        await api.members.update(member.id, dto);
      } else {
        await api.members.create(dto);
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{member ? 'Editar miembro' : 'Nuevo miembro'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={form.fullName} onChange={e => set('fullName', e.target.value)} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)}
              placeholder="88887777" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico <span className="text-slate-400">(opcional)</span></label>
            <input
              type="email"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={form.email} onChange={e => set('email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensualidad (₡)</label>
              <input
                type="number" min="1" step="500"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={form.monthlyAmount} onChange={e => set('monthlyAmount', e.target.value)} required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Día de vencimiento</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={form.dueDay} onChange={e => set('dueDay', e.target.value)}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas <span className="text-slate-400">(opcional)</span></label>
            <textarea
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              value={form.notes} onChange={e => set('notes', e.target.value)}
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | undefined>();
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await api.members.list();
      setMembers(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(m: Member) {
    if (!confirm(`¿Desactivar a ${m.fullName}?`)) return;
    try {
      await api.members.delete(m.id);
      load();
    } catch {
      alert('No se pudo desactivar el miembro. Intenta de nuevo.');
    }
  }

  function openCreate() { setEditing(undefined); setModalOpen(true); }
  function openEdit(m: Member) { setEditing(m); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditing(undefined); }
  function onSaved() { closeModal(); load(); }

  const filtered = members.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.phoneNumber.includes(search)
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Miembros</h1>
          <p className="text-slate-500 text-sm mt-1">{members.filter(m => m.isActive).length} activos</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo miembro
        </button>
      </div>

      <input
        className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        placeholder="Buscar por nombre o teléfono..."
        value={search} onChange={e => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando...</div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-600 text-sm font-medium">No se pudieron cargar los miembros.</p>
          <button onClick={load} className="mt-3 text-sm text-indigo-600 hover:underline">Reintentar</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              {search ? 'No hay resultados.' : 'Agrega tu primer miembro.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Nombre</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Teléfono</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Mensualidad</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Vence</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Estado</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={`${i < filtered.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50 transition-colors`}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{m.fullName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatPhone(m.phoneNumber)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatCRC(m.monthlyAmount)}</td>
                    <td className="px-5 py-3.5 text-slate-600">Día {m.dueDay}</td>
                    <td className="px-5 py-3.5">
                      {m.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700">
                          <UserCheck className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
                          <UserX className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {m.isActive && (
                          <button onClick={() => handleDelete(m)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modalOpen && (
        <MemberModal member={editing} onClose={closeModal} onSave={onSaved} />
      )}
    </div>
  );
}
