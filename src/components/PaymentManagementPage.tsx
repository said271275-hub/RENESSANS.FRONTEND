import React, { useEffect, useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Download,
  Folder,
  X,
  CheckCircle2,
  Receipt,
  Trash2,
  Calendar,
  User,
  ArrowUpDown,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../api/client';
import { GroupPaymentStudent, Payment, Student } from '../types';
import { GroupPaymentsView } from './GroupPaymentsView';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getLocalMonthString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

interface PaymentManagementPageProps {
  apiBase: '/admin' | '/manager';
}

export const PaymentManagementPage: React.FC<PaymentManagementPageProps> = ({ apiBase }) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'journal'>('groups');
  const [selectedMonth, setSelectedMonth] = useState(getLocalMonthString);
  const [groupsRefreshKey, setGroupsRefreshKey] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('Barchasi');
  const [selectedStatus, setSelectedStatus] = useState('Barchasi');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const openPaymentForm = (studentId = '') => {
    setFormData((current) => ({ ...current, studentId, month: selectedMonth }));
    setIsModalOpen(true);
  };

  const openPaymentForStudent = (student: GroupPaymentStudent) => {
    setActiveTab('journal');
    openPaymentForm(String(student.id));
  };

  const changeMonth = (amount: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextMonth = new Date(year, month - 1 + amount, 1);
    setSelectedMonth(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`);
  };

  // Form State
  const [formData, setFormData] = useState({
    studentId: '',
    month: getLocalMonthString(),
    date: getLocalDateString(),
    amount: '',
    method: 'Plastik karta',
    note: '',
  });

  // Load data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [paymentsRes, studentsRes] = await Promise.all([
        api.get<Payment[]>(`${apiBase}/payments`),
        api.get<Student[]>(`${apiBase}/students`),
      ]);
      setPayments(paymentsRes);
      setStudents(studentsRes);
    } catch (err: any) {
      console.error('To\'lovlarni yuklashda xatolik:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch =
        searchQuery === '' ||
        p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.student.group?.name &&
          p.student.group.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.note && p.note.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMethod =
        selectedMethod === 'Barchasi' || p.method === selectedMethod;

      const matchStatus =
        selectedStatus === 'Barchasi' || p.status === selectedStatus;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [payments, searchQuery, selectedMethod, selectedStatus]);

  // Handle Form Submit
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.amount || !formData.date) {
      alert('Iltimos, o\'quvchi, to\'lov summasi va sanasini kiriting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post<{ message: string; payment: Payment }>(`${apiBase}/payments`, {
        studentId: Number(formData.studentId),
        month: formData.month,
        date: formData.date,
        amount: Number(formData.amount),
        method: formData.method,
        note: formData.note,
      });

      setPayments((prev) => [res.payment, ...prev]);
      setGroupsRefreshKey((current) => current + 1);
      setIsModalOpen(false);
      setFormData({
        studentId: '',
        month: getLocalMonthString(),
        date: getLocalDateString(),
        amount: '',
        method: 'Plastik karta',
        note: '',
      });

      setToastMessage(`${res.payment.student.fullName} uchun ${Number(formData.amount).toLocaleString('uz-UZ')} so'm to'lov muvaffaqiyatli qabul qilindi!`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'To\'lovni qabul qilishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete payment
  const handleDeletePayment = async (id: number) => {
    if (!window.confirm('Haqiqatan ham ushbu to\'lov kvitansiyasini o\'chirmoqchimisiz?')) return;
    try {
      await api.delete(`${apiBase}/payments/${id}`);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setToastMessage('To\'lov kvitansiyasi muvaffaqiyatli o\'chirildi.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert('O\'chirishda xatolik yuz berdi.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      alert('Eksport qilish uchun to\'lovlar mavjud emas.');
      return;
    }

    const headers = ['Chek Raqami', 'O\'quvchi', 'Guruh', 'Summa (so\'m)', 'To\'lov Usuli', 'Sana', 'Holat', 'Izoh'];
    const rows = filteredPayments.map((p) => [
      p.receiptNo,
      `"${p.student.fullName}"`,
      `"${p.student.group?.name || 'Guruhsiz'}"`,
      p.amount,
      `"${p.method}"`,
      p.date,
      p.status,
      `"${p.note || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tolovlar_jurnali_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => changeMonth(-1)} aria-label="Oldingi oy">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-36 text-center">
            <p className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Hisobot oyi</p>
            <Input
              aria-label="Hisobot oyi"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="text-center font-bold"
            />
          </div>
          <Button variant="default" size="sm" onClick={() => changeMonth(1)} aria-label="Keyingi oy">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="inline-flex w-fit rounded-2xl neu-inset p-1">
          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${activeTab === 'groups' ? 'neu-raised text-indigo-600' : 'text-[var(--text-secondary)]'}`}
          >
            Guruhlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`rounded-xl px-4 py-2 text-xs font-extrabold transition-all ${activeTab === 'journal' ? 'neu-raised text-indigo-600' : 'text-[var(--text-secondary)]'}`}
          >
            To'lovlar jurnali
          </button>
        </div>
      </div>

      <div className={activeTab === 'journal' ? 'contents' : 'hidden'}>
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl neu-inset bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-extrabold flex items-center gap-2.5 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header (Matching Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            To'lovlar
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium mt-0.5">
            Kassa kirimlari, kvitansiyalar va qarzdorliklar
          </p>
        </div>
      </div>

      {/* Main Journal Card (Matching Image 2) */}
      <Card variant="raised" className="p-5 sm:p-6 border border-[var(--border-subtle)] space-y-6">
        {/* Card Header with Counter and Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              Moliya va To'lovlar jurnali ({payments.length})
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Kassaga qabul qilingan to'lovlar, kvitansiyalar va qarzdorliklar
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-4 h-4 text-[var(--text-secondary)]" />}
              className="neu-button font-bold text-xs !py-2.5"
            >
              Eksport
            </Button>
            <button
              type="button"
              onClick={() => openPaymentForm()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>To'lov qabul qilish</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Matching Image 2) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <input
              type="text"
              placeholder="O'quvchi, guruh yoki chek raqami..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full neu-input text-xs sm:text-sm px-4 py-2.5 rounded-xl"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="md:col-span-3">
            <Select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="text-xs sm:text-sm !py-2.5 rounded-xl font-medium"
            >
              <option value="Barchasi">To'lov usuli: Barchasi</option>
              <option value="Plastik karta">Plastik karta</option>
              <option value="Naqd pul">Naqd pul</option>
              <option value="Click / Payme">Click / Payme</option>
              <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
            </Select>
          </div>

          {/* Status Selector */}
          <div className="md:col-span-3">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs sm:text-sm !py-2.5 rounded-xl font-medium"
            >
              <option value="Barchasi">Holat: Barchasi</option>
              <option value="TO'LANGAN">To'langan</option>
              <option value="KUTILMOQDA">Kutilmoqda</option>
              <option value="BEKOR QILINGAN">Bekor qilingan</option>
            </Select>
          </div>
        </div>

        {/* Content Section: Empty State or Table */}
        {isLoading ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        ) : filteredPayments.length === 0 ? (
          /* Empty State (Exact Match to Image 2) */
          <div className="py-16 px-4 rounded-3xl neu-inset border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl neu-raised flex items-center justify-center text-blue-500 shadow-sm border border-[var(--border-subtle)]">
              <Folder className="w-8 h-8 fill-blue-500/20" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">
                To'lovlar topilmadi
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">
                Hali tizimda to'lovlar amalga oshirilmagan. "To'lov qabul qilish" tugmasi orqali boshlang.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPaymentForm()}
              className="mt-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <span>To'lov qabul qilish</span>
            </button>
          </div>
        ) : (
          /* Payments Table */
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-black/[0.03] dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="py-3.5 px-4">CHEK RAQAMI</th>
                  <th className="py-3.5 px-4">O'QUVCHI</th>
                  <th className="py-3.5 px-4 text-right">SUMMA</th>
                  <th className="py-3.5 px-4 text-center">TO'LOV USULI</th>
                  <th className="py-3.5 px-4 text-center">OY & SANA</th>
                  <th className="py-3.5 px-4 text-center">HOLAT</th>
                  <th className="py-3.5 px-4 text-right">AMALLAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] font-medium">
                {filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.receiptNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs shrink-0">
                          {p.student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">
                            {p.student.fullName}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {p.student.group?.name || 'Guruhsiz'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-sm text-[var(--text-primary)] font-mono">
                        {Number(p.amount).toLocaleString('uz-UZ')} so'm
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold neu-inset border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <p className="font-bold text-xs">{p.date}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">{p.month}</p>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(p)}
                          className="p-1.5 rounded-lg neu-button text-blue-600 hover:text-blue-700 transition-colors"
                          title="Chekni ko'rish / Chop etish"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1.5 rounded-lg neu-button text-rose-500 hover:text-rose-600 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: "To'lov qabul qilish" (Matching Image 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[var(--bg-color)] rounded-3xl neu-raised border border-[var(--border-subtle)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                To'lov qabul qilish
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl neu-button flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePayment} className="p-5 sm:p-6 space-y-4">
              {/* Field 1: O'QUVCHINI TANLANG * */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  O'QUVCHINI TANLANG <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                  className="w-full text-xs sm:text-sm font-semibold !py-2.5 rounded-xl"
                >
                  <option value="">O'quvchini tanlang...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.group?.name || 'Guruhsiz'})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Field 2: TO'LOV OYI (YYYY-MM) * & TO'LOV SANASI * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    TO'LOV OYI (YYYY-MM) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    required
                    className="font-mono text-xs sm:text-sm !py-2.5 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    TO'LOV SANASI <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="font-mono text-xs sm:text-sm !py-2.5 rounded-xl"
                  />
                </div>
              </div>

              {/* Field 3: TO'LOV SUMMASI (SO'M) * & TO'LOV USULI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    TO'LOV SUMMASI (SO'M) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1000"
                    step="1000"
                    placeholder="Summani kiriting..."
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="text-xs sm:text-sm font-mono !py-2.5 rounded-xl"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] font-medium mt-1">
                    Masalan: 320000
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    TO'LOV USULI
                  </label>
                  <Select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="text-xs sm:text-sm !py-2.5 rounded-xl font-medium"
                  >
                    <option value="Plastik karta">Plastik karta</option>
                    <option value="Naqd pul">Naqd pul</option>
                    <option value="Click / Payme">Click / Payme</option>
                    <option value="Bank o'tkazmasi">Bank o'tkazmasi</option>
                  </Select>
                </div>
              </div>

              {/* Field 4: QO'SHIMCHA IZOH (IXTIYORIY) */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  QO'SHIMCHA IZOH (IXTIYORIY)
                </label>
                <Input
                  type="text"
                  placeholder="Masalan: Humo kartadan to'landi"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="text-xs sm:text-sm !py-2.5 rounded-xl"
                />
              </div>

              {/* Modal Footer Buttons (Matching Image 3) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="neu-button font-bold text-xs px-5 py-2.5"
                >
                  Bekor qilish
                </Button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {isSubmitting ? 'Saqlanmoqda...' : 'Davom etish (Tekshirish)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--bg-color)] rounded-3xl neu-raised border border-[var(--border-subtle)] shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-base">To'lov Cheki / Kvitansiya</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-7 h-7 rounded-lg neu-button flex items-center justify-center text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl neu-inset border border-[var(--border-subtle)] space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">CHEK RAQAMI:</span>
                <span className="font-black text-blue-600">{selectedReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">O'QUVCHI:</span>
                <span className="font-bold">{selectedReceipt.student.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">GURUH:</span>
                <span>{selectedReceipt.student.group?.name || 'Guruhsiz'}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">TO'LOV OYI:</span>
                <span>{selectedReceipt.month}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">SANA:</span>
                <span>{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                <span className="text-[var(--text-muted)]">TO'LOV USULI:</span>
                <span>{selectedReceipt.method}</span>
              </div>
              {selectedReceipt.note && (
                <div className="flex justify-between border-b border-dashed border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--text-muted)]">IZOH:</span>
                  <span>{selectedReceipt.note}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-sm font-black text-emerald-600">
                <span>JAMI SUMMA:</span>
                <span>{Number(selectedReceipt.amount).toLocaleString('uz-UZ')} UZS</span>
              </div>
              <div className="text-center pt-2">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-600 border border-emerald-500/40">
                  ✓ TO'LANGAN VA TASDIQLANGAN
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setSelectedReceipt(null)}
                className="font-bold text-xs"
              >
                Yopish
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer className="w-4 h-4" />}
                className="font-bold text-xs bg-blue-600 hover:bg-blue-700"
              >
                Chop etish
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
      </div>
      <div className={activeTab === 'groups' ? 'block' : 'hidden'}>
        <GroupPaymentsView
          apiBase={apiBase}
          month={selectedMonth}
          refreshKey={groupsRefreshKey}
          onCollectPayment={openPaymentForStudent}
        />
      </div>
    </div>
  );
};
