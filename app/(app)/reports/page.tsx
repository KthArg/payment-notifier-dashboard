'use client';
import { useEffect, useState } from 'react';
import { api, ReportData } from '@/lib/api';
import { formatCRC, formatMonth, STATUS_COLOR, STATUS_LABEL } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

const STATUS_CHART_COLORS: Record<string, string> = {
  paid_on_time: '#6366f1',
  paid_late:    '#f59e0b',
  overdue:      '#ef4444',
  pending:      '#94a3b8',
};

export default function ReportsPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data,  setData]  = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const paidRecords   = data?.records.filter(r => r.status === 'paid_on_time' || r.status === 'paid_late') ?? [];
  const unpaidRecords = data?.records.filter(r => r.status === 'pending' || r.status === 'overdue') ?? [];

  const collectionRate = data && data.stats.totalMembers > 0
    ? Math.round(((data.stats.paidOnTime + data.stats.paidLate) / data.stats.totalMembers) * 100)
    : 0;

  const pieData = data ? [
    { name: 'A tiempo',    value: data.stats.paidOnTime, color: STATUS_CHART_COLORS.paid_on_time },
    { name: 'Con retraso', value: data.stats.paidLate,   color: STATUS_CHART_COLORS.paid_late    },
    { name: 'En deuda',    value: data.stats.overdue,    color: STATUS_CHART_COLORS.overdue      },
    { name: 'Pendiente',   value: data.stats.pending,    color: STATUS_CHART_COLORS.pending      },
  ].filter(d => d.value > 0) : [];

  const barData = data ? [
    { label: 'Cobrado',   value: data.stats.totalCollected,   fill: '#6366f1' },
    { label: 'Pendiente', value: data.stats.totalOutstanding, fill: '#fde68a' },
  ] : [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Reporte</h1>
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

      {loading ? (
        <div className="flex items-center justify-center min-h-48">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400 text-sm animate-fade-up">
          Sin datos para este mes.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
            {[
              { label: 'Cobrado',       value: formatCRC(data.stats.totalCollected),   icon: TrendingUp,   color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Por cobrar',    value: formatCRC(data.stats.totalOutstanding), icon: AlertTriangle, color: 'bg-red-50 text-red-500' },
              { label: 'Miembros',      value: data.stats.totalMembers,                icon: Users,        color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Tasa de cobro', value: `${collectionRate}%`,                  icon: CheckCircle,  color: 'bg-blue-50 text-blue-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md transition-shadow duration-200">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            {/* Donut */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Distribución</h2>
              {pieData.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10">Sin datos.</p>
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                          paddingAngle={3} dataKey="value" animationBegin={0} animationDuration={600}>
                          {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v, name) => [`${v}`, String(name)]}
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-xl font-bold text-slate-900">{data.stats.totalMembers}</p>
                      <p className="text-xs text-slate-400">total</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2 justify-center">
                    {pieData.map(d => (
                      <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name} ({d.value})
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bar */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-3">Cobrado vs. pendiente</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₡${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [formatCRC(Number(v))]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={600}>
                    {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress bar */}
          {data.stats.totalMembers > 0 && (
            <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5" style={{ animationDelay: '160ms' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-900">Progreso del mes</p>
                <p className="text-sm text-slate-500">
                  {data.stats.paidOnTime + data.stats.paidLate} / {data.stats.totalMembers} pagaron
                </p>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                {data.stats.paidOnTime > 0 && (
                  <div className="h-full bg-indigo-500 transition-all duration-700"
                    style={{ width: `${(data.stats.paidOnTime / data.stats.totalMembers) * 100}%` }} />
                )}
                {data.stats.paidLate > 0 && (
                  <div className="h-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${(data.stats.paidLate / data.stats.totalMembers) * 100}%` }} />
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-indigo-500" /> A tiempo ({data.stats.paidOnTime})</span>
                <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-400" /> Con retraso ({data.stats.paidLate})</span>
                <span className="flex items-center gap-1 text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-200" /> Sin pagar ({data.stats.pending + data.stats.overdue})</span>
              </div>
            </div>
          )}

          {/* Lists */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 animate-fade-up" style={{ animationDelay: '220ms' }}>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Pagaron ({paidRecords.length})</h2>
              {paidRecords.length === 0 ? (
                <p className="text-sm text-slate-400">Sin pagos aún.</p>
              ) : (
                <div className="space-y-3 stagger">
                  {paidRecords.map(r => (
                    <div key={r.id} className="animate-fade-up flex items-center justify-between">
                      <div>
                        <Link href={`/members/${r.member.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                          {r.member.fullName}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {r.paidAt ? new Date(r.paidAt).toLocaleDateString('es-CR') : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{formatCRC(r.amountPaid ?? r.amountDue)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-4">Sin pagar ({unpaidRecords.length})</h2>
              {unpaidRecords.length === 0 ? (
                <p className="text-sm text-slate-400">¡Todos al día!</p>
              ) : (
                <div className="space-y-3 stagger">
                  {unpaidRecords.map(r => (
                    <div key={r.id} className="animate-fade-up flex items-center justify-between">
                      <div>
                        <Link href={`/members/${r.member.id}`}
                          className="text-sm font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                          {r.member.fullName}
                        </Link>
                        <p className="text-xs text-slate-400">{formatCRC(r.amountDue)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
