import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Search,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import {
  GroupPaymentDetails,
  GroupPaymentStatus,
  GroupPaymentSummary,
  GroupPaymentStudent,
} from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';
import { Select } from './ui/Select';
import { Skeleton } from './ui/Skeleton';

interface GroupPaymentsViewProps {
  apiBase: '/admin' | '/manager';
  month: string;
  refreshKey: number;
  onCollectPayment: (student: GroupPaymentStudent) => void;
}

interface PayrollCalculation {
  teacher: string;
  group: string;
  month: string;
  salaryMode: 'PERCENT' | 'FIXED';
  salaryValue: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  collectedAmount: number;
  expectedAmount: number;
  paymentPercentage: number;
  salaryAmount: number;
  formula: string;
  confirmed: boolean;
}

const formatUZS = (amount: number) => `${Math.round(amount).toLocaleString('uz-UZ')} so'm`;

const formatMonth = (month: string) => {
  const [year, value] = month.split('-').map(Number);
  return `${new Intl.DateTimeFormat('uz-UZ', { month: 'long' }).format(new Date(year, value - 1, 1))} ${year}`;
};

const statusLabels: Record<GroupPaymentStatus, string> = {
  PAID: 'To\'langan',
  PARTIAL: 'Qisman',
  UNPAID: 'To\'lanmagan',
  UNCONFIGURED: 'Narx belgilanmagan',
};

const statusStyles: Record<GroupPaymentStatus, string> = {
  PAID: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  PARTIAL: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  UNPAID: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  UNCONFIGURED: 'bg-slate-500/10 text-[var(--text-secondary)] border-[var(--border-subtle)]',
};

export const GroupPaymentsView: React.FC<GroupPaymentsViewProps> = ({
  apiBase,
  month,
  refreshKey,
  onCollectPayment,
}) => {
  const [groups, setGroups] = useState<GroupPaymentSummary[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [details, setDetails] = useState<GroupPaymentDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GroupPaymentStatus>('ALL');
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [salaryMode, setSalaryMode] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [salaryValue, setSalaryValue] = useState('40');
  const [calculation, setCalculation] = useState<PayrollCalculation | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [payrollError, setPayrollError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      setGroupsError(null);
      const data = await api.get<GroupPaymentSummary[]>(`${apiBase}/payment-groups`, { month });
      setGroups(data);
    } catch (error) {
      setGroupsError(error instanceof Error ? error.message : 'Guruhlar to\'lovini yuklashda xatolik.');
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchDetails = async (groupId: number) => {
    try {
      setDetailsLoading(true);
      setDetailsError(null);
      const data = await api.get<GroupPaymentDetails>(`${apiBase}/payment-groups/${groupId}`, { month });
      setDetails(data);
    } catch (error) {
      setDetails(null);
      setDetailsError(error instanceof Error ? error.message : 'Guruh tafsilotlarini yuklashda xatolik.');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [apiBase, month, refreshKey]);

  useEffect(() => {
    if (selectedGroupId !== null) fetchDetails(selectedGroupId);
  }, [selectedGroupId, month, refreshKey]);

  const filteredGroups = useMemo(
    () => groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [groups, searchQuery]
  );

  const filteredStudents = useMemo(() => {
    if (!details) return [];
    return details.students.filter((student) => {
      const matchesSearch = student.fullName.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [details, studentSearch, statusFilter]);

  const openPayroll = async () => {
    if (!details?.group.teacher) return;
    const teacher = details.group.teacher;
    const mode = teacher.salaryMode || 'PERCENT';
    const value = teacher.salaryValue ?? (mode === 'PERCENT' ? 40 : 0);
    setSalaryMode(mode);
    setSalaryValue(String(value));
    setCalculation(null);
    setPayrollError(null);
    setPayrollOpen(true);
    await calculatePayroll(mode, value);
  };

  const calculatePayroll = async (mode = salaryMode, value = Number(salaryValue)) => {
    if (!details) return;
    try {
      setPayrollLoading(true);
      setPayrollError(null);
      const result = await api.post<PayrollCalculation>(
        `${apiBase}/payment-groups/${details.group.id}/payroll/calculate`,
        { month, salaryMode: mode, salaryValue: value }
      );
      setCalculation(result);
      if (result.confirmed) {
        setSalaryMode(result.salaryMode);
        setSalaryValue(String(result.salaryValue));
      }
    } catch (error) {
      setCalculation(null);
      setPayrollError(error instanceof Error ? error.message : 'Maoshni hisoblashda xatolik.');
    } finally {
      setPayrollLoading(false);
    }
  };

  const saveSalarySettings = async () => {
    if (!details?.group.teacher) return;
    try {
      setPayrollLoading(true);
      setPayrollError(null);
      await api.put(`${apiBase}/teachers/${details.group.teacher.id}/salary`, {
        salaryMode,
        salaryValue: Number(salaryValue),
      });
      await Promise.all([fetchDetails(details.group.id), fetchGroups()]);
      await calculatePayroll(salaryMode, Number(salaryValue));
    } catch (error) {
      setPayrollError(error instanceof Error ? error.message : 'Maosh sozlamasini saqlashda xatolik.');
      setPayrollLoading(false);
    }
  };

  const confirmPayroll = async () => {
    if (!details || !calculation || !window.confirm('Hisoblangan maoshni tasdiqlab, Moliyaga chiqim yozuvi kiritilsinmi?')) return;
    try {
      setPayrollLoading(true);
      setPayrollError(null);
      await api.post(`${apiBase}/payment-groups/${details.group.id}/payroll/confirm`, {
        month,
        salaryMode,
        salaryValue: Number(salaryValue),
      });
      await Promise.all([fetchDetails(details.group.id), fetchGroups()]);
      setCalculation((current) => current ? { ...current, confirmed: true } : current);
    } catch (error) {
      setPayrollError(error instanceof Error ? error.message : 'Maoshni tasdiqlashda xatolik.');
    } finally {
      setPayrollLoading(false);
    }
  };

  const renderPaymentCounts = (summary: Pick<GroupPaymentSummary, 'paidCount' | 'partialCount' | 'unpaidCount' | 'unconfiguredCount'>) => (
    <div className="flex flex-wrap gap-2 text-xs font-bold">
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400">
        To'lagan: {summary.paidCount}
      </span>
      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400">
        Qisman: {summary.partialCount}
      </span>
      <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-rose-700 dark:text-rose-400">
        To'lamagan: {summary.unpaidCount}
      </span>
      {summary.unconfiguredCount > 0 && (
        <span className="rounded-full border border-[var(--border-subtle)] bg-black/[0.03] px-2.5 py-1 text-[var(--text-secondary)]">
          Narx belgilanmagan: {summary.unconfiguredCount}
        </span>
      )}
    </div>
  );

  if (selectedGroupId !== null) {
    const summary = details?.summary;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="default" size="sm" onClick={() => { setSelectedGroupId(null); setDetails(null); }} icon={<ArrowLeft className="h-4 w-4" />}>
              Guruhlarga qaytish
            </Button>
            <div>
              <h2 className="text-xl font-extrabold">{details?.group.name || 'Guruh to\'lovlari'}</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {details?.group.teacher?.fullName || 'O\'qituvchi biriktirilmagan'} · {formatMonth(month)}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={openPayroll}
            disabled={!details?.group.teacher}
            icon={<Calculator className="h-4 w-4" />}
          >
            Hisoblash
          </Button>
        </div>

        {detailsLoading ? (
          <div className="space-y-3"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-40 w-full rounded-2xl" /></div>
        ) : detailsError ? (
          <Card className="text-sm font-semibold text-rose-600">{detailsError}</Card>
        ) : details && summary ? (
          <>
            <Card variant="raised-sm" className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><p className="text-xs text-[var(--text-secondary)]">O'quvchilar</p><p className="text-lg font-black">{details.students.length}</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">To'lov foizi</p><p className="text-lg font-black">{summary.paymentPercentage}%</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">Yig'ilgan</p><p className="text-sm font-extrabold text-emerald-600">{formatUZS(summary.collectedAmount)}</p></div>
                <div><p className="text-xs text-[var(--text-secondary)]">Kutilgan</p><p className="text-sm font-extrabold">{formatUZS(summary.expectedAmount)}</p></div>
              </div>
              {renderPaymentCounts(summary)}
              <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(summary.paymentPercentage, 100)}%` }} />
              </div>
              {details.payroll && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Maosh tasdiqlangan: {formatUZS(details.payroll.amount)}
                </span>
              )}
            </Card>

            <Card variant="raised-sm" className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input label="O'quvchi ismi bo'yicha qidirish" placeholder="Ism kiriting..." value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} />
                <Select label="To'lov holati" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                  <option value="ALL">Hammasi</option>
                  <option value="PAID">To'langan</option>
                  <option value="PARTIAL">Qisman</option>
                  <option value="UNPAID">To'lanmagan</option>
                  <option value="UNCONFIGURED">Narx belgilanmagan</option>
                </Select>
              </div>
            </Card>

            {details.students.length === 0 ? (
              <Card className="py-12 text-center text-sm font-semibold text-[var(--text-secondary)]">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-50" /> Ushbu guruhda o'quvchi yo'q.
              </Card>
            ) : filteredStudents.length === 0 ? (
              <Card className="py-10 text-center text-sm font-semibold text-[var(--text-secondary)]">Filtrga mos o'quvchi topilmadi.</Card>
            ) : (
              <Card variant="raised" className="overflow-x-auto p-0">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead><tr className="border-b border-[var(--border-subtle)] bg-black/[0.03] text-xs font-bold uppercase text-[var(--text-secondary)] dark:bg-white/[0.03]">
                    <th className="px-4 py-3">O'quvchi</th><th className="px-4 py-3 text-right">Oylik narx</th><th className="px-4 py-3 text-right">To'langan</th><th className="px-4 py-3 text-right">Qoldiq</th><th className="px-4 py-3 text-center">Holat</th><th className="px-4 py-3 text-center">Oxirgi to'lov</th><th className="px-4 py-3 text-right">Amal</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3"><p className="font-bold">{student.fullName}</p><p className="text-xs text-[var(--text-muted)]">{student.phone}</p></td>
                        <td className="px-4 py-3 text-right">{formatUZS(student.monthlyFee)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatUZS(student.paidAmount)}</td>
                        <td className="px-4 py-3 text-right">{formatUZS(student.balance)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[student.status]}`}>
                            {student.status === 'PARTIAL' ? `Qisman, ${student.paymentPercentage}%` : statusLabels[student.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs">{student.lastPaymentDate || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="default" onClick={() => onCollectPayment(student)} icon={<CircleDollarSign className="h-4 w-4 text-emerald-600" />}>To'lov</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </>
        ) : null}

        <Modal isOpen={payrollOpen} onClose={() => !payrollLoading && setPayrollOpen(false)} title="O'qituvchi maoshini hisoblash" maxWidth="lg">
          <div className="space-y-4">
            {payrollError && <p className="rounded-xl bg-rose-500/10 p-3 text-sm font-semibold text-rose-600">{payrollError}</p>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select label="Maosh turi" value={salaryMode} onChange={(event) => setSalaryMode(event.target.value as 'PERCENT' | 'FIXED')}>
                <option value="PERCENT">Foiz — yig'ilgan summadan</option>
                <option value="FIXED">Qat'iy oylik — to'lov foizidan</option>
              </Select>
              <Input
                label={salaryMode === 'PERCENT' ? "O'qituvchi ulushi (%)" : "Oylik belgilangan summa (so'm)"}
                type="number"
                min="0"
                max={salaryMode === 'PERCENT' ? '100' : undefined}
                value={salaryValue}
                onChange={(event) => setSalaryValue(event.target.value)}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">O'qituvchi: {details?.group.teacher?.fullName} · Guruh: {details?.group.name} · Oy: {formatMonth(month)}</p>
            {payrollLoading && <Skeleton className="h-24 w-full rounded-2xl" />}
            {calculation && !payrollLoading && (
              <div className="space-y-3 rounded-2xl neu-inset p-4">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="text-emerald-600">To'lagan: {calculation.paidCount}</span>
                  <span className="text-amber-600">Qisman: {calculation.partialCount}</span>
                  <span className="text-rose-600">To'lamagan: {calculation.unpaidCount}</span>
                </div>
                <p className="text-sm">Yig'ilgan summa: <b>{formatUZS(calculation.collectedAmount)}</b></p>
                <p className="text-sm">Hisob: <b>{calculation.formula}</b></p>
                <p className="text-lg font-black text-indigo-600">Maosh: {formatUZS(calculation.salaryAmount)}</p>
                {calculation.confirmed && <p className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Maosh tasdiqlangan</p>}
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-subtle)] pt-4">
              <Button variant="default" onClick={() => calculatePayroll()} isLoading={payrollLoading}>Qayta hisoblash</Button>
              {apiBase === '/admin' && (
                <Button variant="default" onClick={saveSalarySettings} disabled={payrollLoading}>Saqlab qo'yish</Button>
              )}
              {apiBase === '/admin' && (
                <Button variant="primary" onClick={confirmPayroll} disabled={!calculation || calculation.confirmed || payrollLoading}>
                  {calculation?.confirmed ? 'Maosh tasdiqlangan' : 'Maoshni tasdiqlash'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Guruhlar bo'yicha to'lovlar</h2>
          <p className="text-xs text-[var(--text-secondary)]">Jami: {groups.length} ta guruh · {formatMonth(month)}</p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input aria-label="Guruh nomi bo'yicha qidirish" placeholder="Guruh nomini qidiring..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-9" />
        </div>
      </div>

      {groupsLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-2xl" />)}</div>
      ) : groupsError ? (
        <Card className="text-sm font-semibold text-rose-600">{groupsError}</Card>
      ) : filteredGroups.length === 0 ? (
        <Card className="py-12 text-center text-sm font-semibold text-[var(--text-secondary)]">{groups.length === 0 ? 'Guruhlar topilmadi.' : 'Qidiruvga mos guruh topilmadi.'}</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredGroups.map((group) => {
            const tone = group.paymentPercentage >= 75
              ? 'border-emerald-500/30'
              : group.paymentPercentage >= 40
                ? 'border-amber-500/30'
                : 'border-rose-500/30';
            return (
              <Card
                key={group.id}
                variant="raised"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedGroupId(group.id)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedGroupId(group.id); }}
                className={`cursor-pointer space-y-4 border-2 ${tone} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-extrabold">{group.name}</h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{group.teacher?.fullName || 'O\'qituvchi biriktirilmagan'}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-xl neu-inset px-2.5 py-1 text-xs font-bold"><Users className="h-3.5 w-3.5" />{group.studentCount}</span>
                </div>
                {group.studentCount === 0 ? (
                  <div className="rounded-xl neu-inset py-6 text-center text-sm font-semibold text-[var(--text-muted)]">O'quvchi yo'q</div>
                ) : (
                  <>
                    {renderPaymentCounts(group)}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm font-extrabold">
                        <span>To'lov foizi</span><span>{group.paymentPercentage}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div className={`h-full rounded-full transition-all ${group.paymentPercentage >= 75 ? 'bg-emerald-500' : group.paymentPercentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(group.paymentPercentage, 100)}%` }} />
                      </div>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-secondary)]">
                      <span className="font-extrabold text-emerald-600">{formatUZS(group.collectedAmount)}</span> / {formatUZS(group.expectedAmount)}
                    </p>
                  </>
                )}
                {group.payroll && <p className="text-xs font-bold text-emerald-600">Maosh tasdiqlangan · {formatUZS(group.payroll.amount)}</p>}
                <div className="flex justify-end text-xs font-bold text-indigo-600">Tafsilotlar <ChevronRight className="ml-1 h-4 w-4" /></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
