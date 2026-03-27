'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Member, MonthlyRecord } from '@/lib/api';
import { formatCRC, formatPhone, formatMonth, STATUS_COLOR, STATUS_LABEL } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, Calendar, DollarSign } from 'lucide-react';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.members.get(id),
      api.members.records(id),
    ]).then(([m, r]) => {
      setMember(m);
      setRecords(r);
    }).catch(() => router.push('/members'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return <div className="p-8 text-slate-400">Cargando...</div>;
  if (!member) return null;

  const totalPaid = records
    .filter(r => r.status === 'paid_on_time' || r.status === 'paid_late')
    .reduce((s, r) => s + (r.amountPaid ?? 0), 0);

  const sortedRecords = [...records].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/members"
          className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{member.fullName}</h1>
        {member.isActive ? (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">Activo</span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-500">Inactivo</span>
        )}
      </div>

      {/* Info cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Phone className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Teléfono</p>
            <p className="text-sm font-semibold text-slate-900">{formatPhone(member.phoneNumber)}</p>
          </div>
        </div>
        {member.email && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Correo</p>
              <p className="text-sm font-semibold text-slate-900">{member.email}</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Mensualidad</p>
            <p className="text-sm font-semibold text-slate-900">{formatCRC(member.monthlyAmount)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Vence</p>
            <p className="text-sm font-semibold text-slate-900">Día {member.dueDay} de cada mes</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-slate-500">Total cobrado</p>
          <p className="text-lg font-bold text-slate-900">{formatCRC(totalPaid)}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Meses registrados</p>
          <p className="text-sm text-slate-600">{records.length}</p>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Historial de pagos</h2>
        </div>
        {sortedRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Sin registros.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Mes</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Monto</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Pagado</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Fecha</th>
                <th className="text-left px-5 py-3 text-slate-500 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((r, i) => (
                <tr key={r.id} className={`${i < sortedRecords.length - 1 ? 'border-b border-slate-50' : ''}`}>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{formatMonth(r.month, r.year)}</td>
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
        )}
      </div>

      {member.notes && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <p className="text-xs font-medium text-amber-700 mb-1">Notas</p>
          <p className="text-sm text-amber-900">{member.notes}</p>
        </div>
      )}
    </div>
  );
}
