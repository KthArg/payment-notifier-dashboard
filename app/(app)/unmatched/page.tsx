'use client';
import { useEffect, useState } from 'react';
import { api, SinpeSender, Member } from '@/lib/api';
import { formatCRC, formatPhone } from '@/lib/utils';
import { UserX, UserPlus, RefreshCw } from 'lucide-react';

// ── Create member modal pre-filled from sender ────────────────────────────────
function CreateMemberModal({
  sender,
  onClose,
  onCreated,
}: {
  sender: SinpeSender;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    fullName: sender.fullName ?? '',
    phoneNumber: sender.phoneNumber,
    email: '',
    monthlyAmount: '',
    dueDay: '1',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const member = await api.members.create({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim() || undefined,
        monthlyAmount: parseFloat(form.monthlyAmount),
        dueDay: parseInt(form.dueDay),
        notes: form.notes.trim() || undefined,
      });
      await api.sinpeSenders.link(sender.id, member.id);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Registrar como miembro</h2>
          <p className="text-xs text-slate-500 mt-0.5">El remitente quedará vinculado a este miembro.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
            <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo <span className="text-slate-400">(opcional)</span></label>
            <input type="email" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensualidad (₡)</label>
              <input type="number" min="1" step="500" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.monthlyAmount} onChange={e => set('monthlyAmount', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Día vencimiento</label>
              <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={form.dueDay} onChange={e => set('dueDay', e.target.value)}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas <span className="text-slate-400">(opcional)</span></label>
            <textarea rows={2} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Crear miembro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Link to existing member modal ─────────────────────────────────────────────
function LinkMemberModal({
  sender,
  members,
  onClose,
  onLinked,
}: {
  sender: SinpeSender;
  members: Member[];
  onClose: () => void;
  onLinked: () => void;
}) {
  const [memberId, setMemberId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleLink() {
    if (!memberId) return;
    setSaving(true);
    setError('');
    try {
      await api.sinpeSenders.link(sender.id, memberId);
      onLinked();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo vincular el remitente. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-scale-in p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Vincular a miembro existente</h2>
        <select className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={memberId} onChange={e => setMemberId(e.target.value)}>
          <option value="">Seleccionar miembro...</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
        </select>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleLink} disabled={!memberId || saving}
            className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Vinculando...' : 'Vincular'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UnmatchedPage() {
  const [senders, setSenders] = useState<SinpeSender[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState<SinpeSender | null>(null);
  const [linking, setLinking] = useState<SinpeSender | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const [s, m] = await Promise.all([
        api.sinpeSenders.list('unknown'),
        api.members.list(),
      ]);
      setSenders(s);
      setMembers(m);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDismiss(sender: SinpeSender) {
    if (!confirm(`¿Descartar a ${sender.fullName ?? sender.phoneNumber}? Las transacciones futuras de este número no generarán notificaciones.`)) return;
    try {
      await api.sinpeSenders.dismiss(sender.id);
      load();
    } catch {
      alert('No se pudo descartar el remitente. Intenta de nuevo.');
    }
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sin identificar</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pagadores que hicieron un SINPE pero no están registrados como miembros.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : loadError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-red-600 text-sm font-medium">No se pudieron cargar los remitentes.</p>
          <button onClick={load} className="mt-3 text-sm text-indigo-600 hover:underline">Reintentar</button>
        </div>
      ) : senders.length === 0 ? (
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-slate-900 font-medium">Sin pagadores desconocidos</p>
          <p className="text-slate-400 text-sm mt-1">Todos los SINPE recibidos están identificados.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {senders.map(s => (
            <div key={s.id} className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Sender info */}
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{s.fullName ?? 'Sin nombre'}</p>
                  <p className="text-sm text-slate-500">{formatPhone(s.phoneNumber)}</p>
                  {s.lastTransaction && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {s.lastTransaction.currency === 'CRC' ? '₡' : '$'}
                        {formatCRC(s.lastTransaction.amount).replace('₡', '')}
                      </span>
                      <span>{s.lastTransaction.bankName}</span>
                      <span>{new Date(s.lastTransaction.transactionDate).toLocaleDateString('es-CR')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <button
                    onClick={() => setCreating(s)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Crear miembro
                  </button>
                  <button
                    onClick={() => setLinking(s)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Vincular
                  </button>
                  <button
                    onClick={() => handleDismiss(s)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-white border border-red-100 text-red-500 font-medium hover:bg-red-50 transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" /> Descartar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <CreateMemberModal
          sender={creating}
          onClose={() => setCreating(null)}
          onCreated={() => { setCreating(null); load(); }}
        />
      )}
      {linking && (
        <LinkMemberModal
          sender={linking}
          members={members}
          onClose={() => setLinking(null)}
          onLinked={() => { setLinking(null); load(); }}
        />
      )}
    </div>
  );
}
