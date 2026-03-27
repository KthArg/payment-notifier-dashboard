'use client';
import { useEffect, useState } from 'react';
import { api, ReportData, MonthlyRecordWithMember } from '@/lib/api';
import { formatCRC, formatMonth, STATUS_COLOR, STATUS_LABEL } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function PaymentsPage() {
  const now = new Date();
  const [year,   setYear]   = useState(now.getFullYear());
  const [month,  setMonth]  = useState(now.getMonth() + 1);
  const [data,   setData]   = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    api.reports.get(year, month)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const filtered: MonthlyRecordWithMember[] = (data?.records ?? []).filter(r =>
    filter === 'all' || r.status === filter
  );

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Pagos</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-900 min-w-[140px] text-center">
            {formatMonth(month, year)}
          </span>
          <button onClick={nextMonth} disabled={isCurrentMonth}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
          {[
            { label: 'A tiempo',    value: data.stats.paidOnTime, color: 'bg-indigo-50 text-indigo-700 border border-indigo-100' },
            { label: 'Con retraso', value: data.stats.paidLate,   color: 'bg-amber-50 text-amber-700 border border-amber-100' },
            { label: 'Pendientes',  value: data.stats.pending,    color: 'bg-blue-50 text-blue-700 border border-blue-100' },
            { label: 'En deuda',    value: data.stats.overdue,    color: 'bg-red-50 text-red-700 border border-red-100' },
          ].map(s => (
            <div key={s.label} className={`animate-fade-up rounded-xl px-4 py-3 ${s.color}`}>
              <p className="text-xs font-medium opacity-75">{s.label}</p>
              <p className="text-xl font-bold mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap animate-fade-up" style={{ animationDelay: '100ms' }}>
        {[
          { value: 'all',         label: 'Todos' },
          { value: 'paid_on_time', label: 'A tiempo' },
          { value: 'paid_late',    label: 'Con retraso' },
          { value: 'pending',      label: 'Pendientes' },
          { value: 'overdue',      label: 'En deuda' },
        ].map(opt => (
          <button key={opt.value} onClick={() => setFilter(opt.value)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-150 ${
              filter === opt.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm animate-fade-up">
          Sin datos para este mes.
        </div>
      ) : (
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ animationDelay: '150ms' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Sin resultados.</div>
          ) : (
            /* Mobile: cards / Desktop: table */
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Miembro</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Debe</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Pagó</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Fecha</th>
                      <th className="text-left px-5 py-3 text-slate-500 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.id} className={`${i < filtered.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50 transition-colors`}>
                        <td className="px-5 py-3.5">
                          <Link href={`/members/${r.member.id}`}
                            className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                            {r.member.fullName}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{formatCRC(r.amountDue)}</td>
                        <td className="px-5 py-3.5 text-slate-600">{r.amountPaid ? formatCRC(r.amountPaid) : '—'}</td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {r.paidAt ? new Date(r.paidAt).toLocaleDateString('es-CR') : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status]}`}>
                            {STATUS_LABEL[r.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-slate-50">
                {filtered.map(r => (
                  <div key={r.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/members/${r.member.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-indigo-600 truncate block">
                        {r.member.fullName}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {r.paidAt ? new Date(r.paidAt).toLocaleDateString('es-CR') : '—'} · {formatCRC(r.amountDue)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {data && (
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between" style={{ animationDelay: '200ms' }}>
          <p className="text-sm text-slate-500">Total cobrado</p>
          <p className="text-lg font-bold text-slate-900">{formatCRC(data.stats.totalCollected)}</p>
        </div>
      )}
    </div>
  );
}
