import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, DollarSign, TrendingUp, TrendingDown, Layers, ArrowUpRight, Trophy, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { ManagerOverview } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

export const ManagerOverviewPage: React.FC = () => {
  const [data, setData] = useState<ManagerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await api.get<ManagerOverview>('/manager/overview');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const formatUZS = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Welcome Card */}
      <Card variant="raised" className="relative overflow-hidden border border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Menejer boshqaruv konsoli
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Jonli Moliya
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-[var(--text-primary)]">
              Markaz Moliyasi va O'quvchilar Ko'rsatkichlari
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 max-w-xl">
              Bu yerda markazning daromadlari, xarajatlari, sof foydasi va baholashga asoslangan o'quvchilar reytingini real vaqtda kuzatishingiz mumkin.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/manager/finance')}
              icon={<DollarSign className="w-4 h-4" />}
            >
              Moliya bo'limi
            </Button>
            <Button
              variant="default"
              onClick={() => navigate('/manager/ratings')}
              icon={<Trophy className="w-4 h-4 text-amber-500" />}
            >
              Reytinglar
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Jami O'quvchilar"
          value={data?.totalStudents || 0}
          icon={<Users className="w-6 h-6 text-indigo-500" />}
          subtitle="Faol ta'lim olayotganlar"
        />
        <StatCard
          title="O'qituvchilar"
          value={data?.totalTeachers || 0}
          icon={<GraduationCap className="w-6 h-6 text-purple-500" />}
          subtitle="Faol o'qituvchilar soni"
        />
        <StatCard
          title="Guruhlar soni"
          value={data?.totalGroups || 0}
          icon={<Layers className="w-6 h-6 text-sky-500" />}
          subtitle="Jami shakllantirilgan guruhlar"
        />
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="raised" className="border-t-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Jami Kirim (To'lovlar)
            </span>
            <div className="p-2.5 rounded-xl neu-inset text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-3 text-[var(--text-primary)]">
            {formatUZS(data?.totalIncome || 0)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">O'quvchilar kurs to'lovlari</p>
        </Card>

        <Card variant="raised" className="border-t-4 border-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Jami Chiqim (Xarajatlar)
            </span>
            <div className="p-2.5 rounded-xl neu-inset text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black mt-3 text-[var(--text-primary)]">
            {formatUZS(data?.totalExpense || 0)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Maoshlar, ijara va kommunal</p>
        </Card>

        <Card variant="raised" className="border-t-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Sof Foyda (Net Profit)
            </span>
            <div className="p-2.5 rounded-xl neu-inset text-indigo-500">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 ${
            (data?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatUZS(data?.netProfit || 0)}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Daromaddan xarajat ayrilgan sof foyda</p>
        </Card>
      </div>
    </div>
  );
};
