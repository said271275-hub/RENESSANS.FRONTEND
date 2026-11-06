import React, { useEffect, useState } from 'react';
import { Users, GraduationCap, Layers, CalendarCheck, CheckCircle2, XCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../api/client';
import { DashboardStats } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<DashboardStats>('/admin/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Statistika xatosi:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const totalMarked = 
    (stats?.statusCounts.keldi || 0) +
    (stats?.statusCounts.kelmadi || 0) +
    (stats?.statusCounts.sababli || 0);

  return (
    <div className="space-y-8">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Jami O'quvchilar"
          value={stats?.studentsCount || 0}
          icon={<Users className="w-6 h-6 text-indigo-500" />}
          subtitle="Faol ro'yxatdan o'tganlar"
        />
        <StatCard
          title="O'qituvchilar"
          value={stats?.teachersCount || 0}
          icon={<GraduationCap className="w-6 h-6 text-purple-500" />}
          subtitle="Mutaxassis murabbiylar"
        />
        <StatCard
          title="Guruhlar soni"
          value={stats?.groupsCount || 0}
          icon={<Layers className="w-6 h-6 text-sky-500" />}
          subtitle="Faol dars guruhlari"
        />
        <StatCard
          title="Bugungi davomat"
          value={`${stats?.attendancePercentage || 0}%`}
          icon={<CalendarCheck className="w-6 h-6 text-emerald-500" />}
          subtitle="Kelganlar nisbati"
          trend={{
            value: `${stats?.statusCounts.keldi || 0} nafar o'quvchi keldi`,
            isPositive: (stats?.attendancePercentage || 0) >= 70,
          }}
        />
      </div>

      {/* Today Attendance Breakdown */}
      <Card variant="raised">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-base">Bugungi davomat taqsimoti</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Real-vaqt
            </span>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Jami qayd etilganlar: <strong className="text-[var(--text-primary)]">{totalMarked}</strong> ta
          </span>
        </div>

        {/* Visual Progress Bar */}
        {totalMarked > 0 && (
          <div className="w-full h-3 rounded-full neu-inset overflow-hidden flex mb-5 border border-[var(--border-subtle)]">
            <div
              style={{ width: `${((stats?.statusCounts.keldi || 0) / totalMarked) * 100}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title="Keldi"
            />
            <div
              style={{ width: `${((stats?.statusCounts.sababli || 0) / totalMarked) * 100}%` }}
              className="bg-sky-500 h-full transition-all duration-500"
              title="Sababli"
            />
            <div
              style={{ width: `${((stats?.statusCounts.kelmadi || 0) / totalMarked) * 100}%` }}
              className="bg-rose-500 h-full transition-all duration-500"
              title="Kelmadi"
            />
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl neu-inset flex items-center gap-3 border border-emerald-500/20">
            <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Keldi</p>
              <p className="text-xl font-extrabold">{stats?.statusCounts.keldi || 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl neu-inset flex items-center gap-3 border border-rose-500/20">
            <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Kelmadi</p>
              <p className="text-xl font-extrabold">{stats?.statusCounts.kelmadi || 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl neu-inset flex items-center gap-3 border border-sky-500/20">
            <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center text-sky-600 dark:text-sky-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] font-semibold">Sababli</p>
              <p className="text-xl font-extrabold">{stats?.statusCounts.sababli || 0}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Two columns: Recent Students and Recent Attendances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <Card variant="raised">
          <h3 className="font-extrabold text-base mb-4">So'nggi qo'shilgan o'quvchilar</h3>
          <div className="space-y-3">
            {stats?.recentStudents && stats.recentStudents.length > 0 ? (
              stats.recentStudents.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl neu-inset flex items-center justify-between border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl neu-raised flex items-center justify-center font-bold text-xs text-indigo-500">
                      {s.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{s.fullName}</p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">{s.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)]">
                    {s.group?.name || 'Guruhsiz'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">O'quvchilar mavjud emas</p>
            )}
          </div>
        </Card>

        {/* Recent Attendance */}
        <Card variant="raised">
          <h3 className="font-extrabold text-base mb-4">So'nggi belgilangan davomatlar</h3>
          <div className="space-y-3">
            {stats?.recentAttendances && stats.recentAttendances.length > 0 ? (
              stats.recentAttendances.map((a) => (
                <div key={a.id} className="p-3.5 rounded-xl neu-inset flex items-center justify-between border border-[var(--border-subtle)]">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{a.student.fullName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {a.group.name} • <span className="font-mono">{a.date}</span>
                    </p>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">Davomat yozuvlari mavjud emas</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
