'use client';
import { useEffect, useState } from 'react';
import { api, SinpeSender } from '@/lib/api';
import { formatCRC, formatPhone } from '@/lib/utils';
import { RotateCcw, Ban } from 'lucide-react';

export default function ExternalPage() {
  const [senders, setSenders] = useState<SinpeSender[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    api.sinpeSenders.list('dismissed')
      .then(setSenders)
      .catch(() => setSenders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRevert(sender: SinpeSender) {
    if (!confirm(`¿Reactivar notificaciones para ${sender.fullName ?? sender.phoneNumber}?`)) return;
    await api.sinpeSenders.revert(sender.id);
    load();
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Transacciones externas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Pagadores descartados. Sus SINPE se registran pero no generan notificaciones de WhatsApp.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : senders.length === 0 ? (
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <Ban className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-900 font-medium">Sin transacciones externas</p>
          <p className="text-slate-400 text-sm mt-1">No has descartado ningún pagador todavía.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-fade-up">
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Pagador</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Teléfono</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Último pago</th>
                  <th className="text-left px-5 py-3 text-slate-500 font-medium">Descartado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {senders.map((s, i) => (
                  <tr key={s.id} className={`${i < senders.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50 transition-colors`}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{s.fullName ?? 'Sin nombre'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{formatPhone(s.phoneNumber)}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {s.lastTransaction ? (
                        <span>
                          {formatCRC(s.lastTransaction.amount)} — {s.lastTransaction.bankName}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {s.dismissedAt ? new Date(s.dismissedAt).toLocaleDateString('es-CR') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => handleRevert(s)}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                        <RotateCcw className="w-3.5 h-3.5" /> Reactivar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-slate-50">
            {senders.map(s => (
              <div key={s.id} className="px-4 py-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{s.fullName ?? 'Sin nombre'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{formatPhone(s.phoneNumber)}</p>
                  {s.lastTransaction && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatCRC(s.lastTransaction.amount)} · {s.lastTransaction.bankName}
                    </p>
                  )}
                </div>
                <button onClick={() => handleRevert(s)}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                  <RotateCcw className="w-3 h-3" /> Reactivar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
