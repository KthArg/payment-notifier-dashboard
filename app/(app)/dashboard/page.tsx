'use client';
import { useEffect, useState } from 'react';
import { api, ReportData } from '@/lib/api';
import { formatCRC, formatMonth, STATUS_COLOR, STATUS_LABEL } from '@/lib/utils';
import { TrendingUp, Users, AlertCircle, Clock } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, delay = 0 }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; delay?: number;
}) {
  return (
    <div
      className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────────
const PIE_COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#94a3b8'];
const PIE_LABELS = ['A tiempo', 'Con retraso', 'En deuda', 'Pendiente'];

function DonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={600}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number, name: string) => [`${v} miembros`, name]}
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-bold text-slate-900">{total}</p>
        <p className="text-xs text-slate-400">miembros</p>
      </div>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────────
function TrendChart({ months }: { months: { label: string; collected: number; outstanding: number }[] }) {
  const fmt = (v: number) => `₡${(v / 1000).toFixed(0)}K`;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={months} barCategoryGap="30%" margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number, name: string) => [formatCRC(v), name === 'collected' ? 'Cobrado' : 'Pendiente']}
          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 13 }}
        />
        <Bar dataKey="collected" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={600} />
        <Bar dataKey="outstanding" fill="#fde68a" radius={[4, 4, 0, 0]} animationDuration={700} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [trendMonths, setTrendMonths] = useState<{ label: string; collected: number; outstanding: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    api.reports.current().then(async (current) => {
      setData(current);

      // Fetch last 5 months for trend
      const months = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        try {
          const r = await api.reports.get(y, m);
          months.push({
            label: d.toLocaleString('es', { month: 'short' }),
            collected: r.stats.totalCollected,
            outstanding: r.stats.totalOutstanding,
          });
        } catch {
          months.push({
            label: d.toLocaleString('es', { month: 'short' }),
            collected: 0,
            outstanding: 0,
          });
        }
      }
      setTrendMonths(months);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-red-500 text-sm">Error al cargar datos.</div>;

  const { stats, records } = data;
  const now = new Date();

  const recent = [...records]
    .filter(r => r.status === 'paid_on_time' || r.status === 'paid_late')
    .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())
    .slice(0, 6);

  const pending = records.filter(r => r.status === 'pending' || r.status === 'overdue');

  const pieData = [
    { name: PIE_LABELS[0], value: stats.paidOnTime,  color: PIE_COLORS[0] },
    { name: PIE_LABELS[1], value: stats.paidLate,    color: PIE_COLORS[1] },
    { name: PIE_LABELS[2], value: stats.overdue,     color: PIE_COLORS[2] },
    { name: PIE_LABELS[3], value: stats.pending,     color: PIE_COLORS[3] },
  ].filter(d => d.value > 0);

  const collectionRate = stats.totalMembers > 0
    ? Math.round(((stats.paidOnTime + stats.paidLate) / stats.totalMembers) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{formatMonth(now.getMonth() + 1, now.getFullYear())}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 stagger">
        <StatCard label="Cobrado" value={formatCRC(stats.totalCollected)} icon={TrendingUp} color="bg-emerald-50 text-emerald-600" delay={0} />
        <StatCard label="Por cobrar" value={formatCRC(stats.totalOutstanding)} icon={AlertCircle} color="bg-red-50 text-red-500" delay={60} />
        <StatCard
          label="Pagaron"
          value={`${stats.paidOnTime + stats.paidLate}/${stats.totalMembers}`}
          sub={`${collectionRate}% tasa de cobro`}
          icon={Users}
          color="bg-indigo-50 text-indigo-600"
          delay={120}
        />
        <StatCard
          label="Pendientes"
          value={stats.pending + stats.overdue}
          sub={stats.overdue > 0 ? `${stats.overdue} en deuda` : undefined}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
          delay={180}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Donut */}
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5" style={{ animationDelay: '200ms' }}>
          <h2 className="font-semibold text-slate-900 mb-4">Estado del mes</h2>
          {pieData.length === 0 ? (
            <p className="text-slate-400 text-sm py-10 text-center">Sin miembros registrados.</p>
          ) : (
            <>
              <DonutChart data={pieData} />
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                {pieData.map(d => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar trend */}
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5" style={{ animationDelay: '260ms' }}>
          <h2 className="font-semibold text-slate-900 mb-4">Tendencia 5 meses</h2>
          {trendMonths.length === 0 ? (
            <p className="text-slate-400 text-sm py-10 text-center">Sin datos.</p>
          ) : (
            <>
              <TrendChart months={trendMonths} />
              <div className="flex gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Cobrado
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" /> Pendiente
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lists */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent payments */}
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5" style={{ animationDelay: '320ms' }}>
          <h2 className="font-semibold text-slate-900 mb-4">Pagos recientes</h2>
          {recent.length === 0 ? (
            <p className="text-slate-400 text-sm">Sin pagos este mes aún.</p>
          ) : (
            <div className="space-y-3 stagger">
              {recent.map(r => (
                <div key={r.id} className="animate-fade-up flex items-center justify-between group">
                  <div>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{r.member.fullName}</p>
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

        {/* Pending */}
        <div className="animate-fade-up bg-white rounded-2xl border border-slate-100 p-5" style={{ animationDelay: '380ms' }}>
          <h2 className="font-semibold text-slate-900 mb-4">Pagos pendientes</h2>
          {pending.length === 0 ? (
            <p className="text-slate-400 text-sm">¡Todos al día!</p>
          ) : (
            <div className="space-y-3 stagger">
              {pending.map(r => (
                <div key={r.id} className="animate-fade-up flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{r.member.fullName}</p>
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
    </div>
  );
}
