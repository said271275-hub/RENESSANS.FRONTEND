import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Users, CalendarCheck, Award, Calendar, Clock, ArrowRight, Sparkles, CheckCheck, Trophy } from 'lucide-react';
import { api } from '../../api/client';
import { Teacher, Group } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';

interface TeacherProfileResponse {
  teacher: Teacher;
  stats: {
    totalGroups: number;
    totalStudents: number;
    averageAttendance: number;
    averageGrade: number;
    totalGradesGiven: number;
  };
}

export const TeacherDashboardPage: React.FC = () => {
  const [profileData, setProfileData] = useState<TeacherProfileResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [profileRes, groupsRes] = await Promise.all([
          api.get<TeacherProfileResponse>('/teacher/profile'),
          api.get<Group[]>('/teacher/groups'),
        ]);
        setProfileData(profileRes);
        setGroups(groupsRes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
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
      {/* Teacher Welcome Card */}
      <Card variant="raised" className="border border-[var(--border-subtle)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl neu-inset flex items-center justify-center font-black text-2xl text-indigo-500 shadow-[var(--shadow-inset-sm)]">
              {profileData?.teacher.user.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  O'qituvchi Kabineti
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Ustoz
                </span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight mt-0.5 text-[var(--text-primary)]">
                Xush kelibsiz, {profileData?.teacher.user.fullName}!
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                Faningiz: <strong className="text-[var(--text-primary)]">{profileData?.teacher.subject}</strong> • Telefon: <span className="font-mono">{profileData?.teacher.phone}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/teacher/groups')}
              icon={<Layers className="w-4 h-4" />}
            >
              Guruhlarim
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Biriktirilgan Guruhlar"
          value={profileData?.stats.totalGroups || 0}
          icon={<Layers className="w-6 h-6 text-indigo-500" />}
          subtitle="Siz dars beradigan guruhlar"
        />
        <StatCard
          title="Jami O'quvchilar"
          value={profileData?.stats.totalStudents || 0}
          icon={<Users className="w-6 h-6 text-purple-500" />}
          subtitle="Guruhlaringizdagi shogirdlar"
        />
        <StatCard
          title="O'rtacha Davomat"
          value={`${profileData?.stats.averageAttendance || 0}%`}
          icon={<CalendarCheck className="w-6 h-6 text-emerald-500" />}
          subtitle="Darslarga qatnashish ko'rsatkichi"
        />
        <StatCard
          title="O'rtacha Baho"
          value={`${profileData?.stats.averageGrade || 0}`}
          icon={<Award className="w-6 h-6 text-amber-500" />}
          subtitle={`Jami baholar: ${profileData?.stats.totalGradesGiven || 0} ta`}
        />
      </div>

      {/* Assigned Groups Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg">Sizning guruhlaringiz</h3>
            <p className="text-xs text-[var(--text-secondary)]">Dars jadvali va tezkor boshqaruv amallari</p>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Jami <strong className="text-[var(--text-primary)]">{groups.length}</strong> ta faol guruh
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => (
            <Card key={group.id} variant="raised" className="flex flex-col justify-between hover:scale-[1.015] transition-all border border-[var(--border-subtle)]">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-2xl neu-inset flex items-center justify-center text-indigo-500 font-bold shadow-[var(--shadow-inset-sm)]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)]">
                    {group.students?.length || 0} o'quvchi
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-[var(--text-primary)]">{group.name}</h4>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> {group.schedule}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full !bg-rose-600 hover:!bg-rose-700 !text-white"
                  onClick={() => navigate(`/teacher/groups/${group.id}`)}
                  icon={<Trophy className="w-3.5 h-3.5" />}
                >
                  O'quvchilar reytingi va baholash
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
