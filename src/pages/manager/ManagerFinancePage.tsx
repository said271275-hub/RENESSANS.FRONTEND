import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { api } from '../../api/client';
import { Transaction, MonthlyChartItem } from '../../types';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ManagerFinancePage: React.FC = () => {
  const { user } = useAuth();
  const canEditTransactions = user?.role === 'ADMIN';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<MonthlyChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Transaction | null>(null);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    type: 'INCOME',
    category: 'O\'quvchi to\'lovi',
    amount: '',
    date: getLocalDateString(),
    note: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transRes, chartRes] = await Promise.all([
        api.get<Transaction[]>('/manager/transactions', {
          type: filterType,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        api.get<MonthlyChartItem[]>('/manager/chart'),
      ]);
      setTransactions(transRes);
      setChartData(chartRes);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setCurrentPage(1);
  }, [filterType, startDate, endDate]);

  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);
    const netProfit = income - expense;
    return { income, expense, netProfit };
  }, [transactions]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      type: 'INCOME',
      category: 'O\'quvchi to\'lovi',
      amount: '',
      date: getLocalDateString(),
      note: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (t: Transaction) => {
    setEditingItem(t);
    setFormData({
      type: t.type,
      category: t.category,
      amount: String(t.amount),
      date: t.date,
      note: t.note || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category.trim() || !formData.amount || !formData.date) {
      setFormError('Barcha majburiy maydonlarni to\'ldiring.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        type: formData.type,
        category: formData.category.trim(),
        amount: Number(formData.amount),
        date: formData.date,
        note: formData.note.trim(),
      };

      if (editingItem) {
        await api.put(`/manager/transactions/${editingItem.id}`, payload);
      } else {
        await api.post('/manager/transactions', payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/manager/transactions/${itemToDelete.id}`);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'O\'chirishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  };

  // Pagination
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage]);

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;

  const columns: Column<Transaction>[] = [
    {
      header: 'Turi',
      accessor: (t: Transaction) => (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
            t.type === 'INCOME'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
          }`}
        >
          {t.type === 'INCOME' ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" /> Kirim
            </>
          ) : (
            <>
              <TrendingDown className="w-3.5 h-3.5" /> Chiqim
            </>
          )}
        </span>
      ),
    },
    {
      header: 'Kategoriya',
      accessor: (t) => <span className="font-semibold text-sm">{t.category}</span>,
    },
    {
      header: 'Summa',
      accessor: (t) => (
        <span
          className={`font-mono font-bold text-sm ${
            t.type === 'INCOME'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {t.type === 'INCOME' ? '+' : '-'} {formatUZS(t.amount)}
        </span>
      ),
    },
    {
      header: 'Sana',
      accessor: (t) => <span className="text-xs font-mono text-[var(--text-secondary)]">{t.date}</span>,
    },
    {
      header: 'Izoh',
      accessor: (t) => <span className="text-xs text-[var(--text-muted)]">{t.note || '-'}</span>,
    },
    ...(canEditTransactions ? [{
      header: 'Amallar',
      className: 'text-right',
      accessor: (t: Transaction) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => openEditModal(t)}
            className="!p-2 text-indigo-500"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setItemToDelete(t);
              setIsDeleteModalOpen(true);
            }}
            className="!p-2"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Moliya va Tranzaksiyalar</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Markazning barcha to'lovlari, maoshlar, ijara va xarajatlar balansi
          </p>
        </div>
        {canEditTransactions && (
          <Button
            variant="primary"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
            className="shadow-[var(--shadow-raised)]"
          >
            Yangi tranzaksiya kiritish
          </Button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl neu-raised border border-[var(--border-subtle)] space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Jami Kirim
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatUZS(summary.income)}
          </p>
        </div>
        <div className="p-5 rounded-2xl neu-raised border border-[var(--border-subtle)] space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Jami Chiqim
          </p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatUZS(summary.expense)}
          </p>
        </div>
        <div className="p-5 rounded-2xl neu-raised border border-[var(--border-subtle)] space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Sof Foyda (Net)
          </p>
          <p className={`text-2xl font-black ${
            summary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatUZS(summary.netProfit)}
          </p>
        </div>
      </div>

      {/* Recharts Monthly Finance Chart */}
      <Card variant="raised" className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base">Oylik Kirim va Chiqim grafigi</h3>
            <p className="text-xs text-[var(--text-secondary)]">Oylar kesimida tushumlar va xarajatlar taqqoslamasi</p>
          </div>
        </div>
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.12} />
              <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={12} />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `${Math.round(value / 1000000)}M`}
              />
              <Tooltip
                formatter={(value: any) => formatUZS(Number(value))}
                contentStyle={{
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-raised)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              />
              <Legend />
              <Bar dataKey="income" name="Kirim" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" name="Chiqim" fill="#F43F5E" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Filter and Search */}
      <Card variant="raised-sm" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Tranzaksiya turi"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Barchasi (Kirim va Chiqim)</option>
            <option value="INCOME">Faqat Kirim</option>
            <option value="EXPENSE">Faqat Chiqim</option>
          </Select>

          <Input
            label="Boshlang'ich sana"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            label="Tugash sanasi"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Table */}
      <Table
        data={paginatedTransactions}
        columns={columns}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        emptyMessage="Tranzaksiyalar topilmadi"
      />

      {/* Add / Edit Transaction Modal */}
      {canEditTransactions && <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Tranzaksiyani tahrirlash" : "Yangi tranzaksiya kiritish"}
        description="Kirim yoki chiqim ma'lumotlarini to'ldiring"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl neu-inset bg-rose-500/10 text-rose-600 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Amal turi"
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value;
                setFormData({
                  ...formData,
                  type: newType,
                  category: newType === 'INCOME' ? 'O\'quvchi to\'lovi' : 'O\'qituvchi maoshi',
                });
              }}
            >
              <option value="INCOME">Kirim (Daromad)</option>
              <option value="EXPENSE">Chiqim (Xarajat)</option>
            </Select>

            <Select
              label="Kategoriya"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {formData.type === 'INCOME' ? (
                <>
                  <option value="O'quvchi to'lovi">O'quvchi to'lovi</option>
                  <option value="Kitob va materiallar">Kitob va materiallar</option>
                  <option value="Boshqa kirim">Boshqa kirim</option>
                </>
              ) : (
                <>
                  <option value="O'qituvchi maoshi">O'qituvchi maoshi</option>
                  <option value="Bino ijarasi">Bino ijarasi</option>
                  <option value="Kommunal va Internet">Kommunal va Internet</option>
                  <option value="Kantselyariya va qog'oz">Kantselyariya va qog'oz</option>
                  <option value="Marketing va Target">Marketing va Target</option>
                  <option value="Choy-kofe va tozalik">Choy-kofe va tozalik</option>
                  <option value="Boshqa chiqim">Boshqa chiqim</option>
                </>
              )}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Summa (UZS)"
              type="number"
              placeholder="Masalan: 500000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
            <Input
              label="Sana"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <Input
            label="Izoh (Ixtiyoriy)"
            placeholder="To'lov haqida qisqacha ma'lumot..."
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button
              type="button"
              variant="default"
              onClick={() => setIsModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {editingItem ? 'Saqlash' : 'Kiritish'}
            </Button>
          </div>
        </form>
      </Modal>}

      {/* Delete Confirmation Modal */}
      {canEditTransactions && <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Tranzaksiyani o'chirish"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Haqiqatan ham ushbu tranzaksiyani o'chirmoqchimisiz? Ushbu amal hisobotlarga ta'sir qiladi.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="default"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isSubmitting}
              onClick={confirmDelete}
            >
              Ha, o'chirish
            </Button>
          </div>
        </div>
      </Modal>}
    </div>
  );
};
