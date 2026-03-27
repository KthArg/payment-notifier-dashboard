import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCRC(amount: number): string {
  return `₡${amount.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^506/, '');
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return phone;
}

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export function formatMonth(month: number, year: number): string {
  return `${MONTHS[month - 1]} ${year}`;
}

export const STATUS_LABEL: Record<string, string> = {
  paid_on_time: 'Al día',
  paid_late: 'Pago tardío',
  overdue: 'En deuda',
  pending: 'Pendiente',
};

export const STATUS_COLOR: Record<string, string> = {
  paid_on_time: 'bg-emerald-100 text-emerald-800',
  paid_late: 'bg-amber-100 text-amber-800',
  overdue: 'bg-red-100 text-red-800',
  pending: 'bg-slate-100 text-slate-600',
};
