import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Star, Calendar, Filter, Sparkles, Crown } from 'lucide-react';
import { api } from '../../api/client';
import { StudentRatingItem, Group } from '../../types';
import { Tabs } from '../../components/ui/Tabs';
import { Table, Column } from '../../components/ui/Table';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const ManagerRatingPage: React.FC = () => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [ratings, setRatings] = useState<StudentRatingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.get<Group[]>('/manager/groups');
        setGroups(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const fetchRatings = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<StudentRatingItem[]>('/manager/ratings', {
        period,
        groupId: selectedGroup || undefined,
      });
      setRatings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [period, selectedGroup]);

  const top3 = ratings.slice(0, 3);

  const columns: Column<StudentRatingItem>[] = [
    {
      header: 'O\'rin',
      className: 'w-20 text-center',
      accessor: (item) => {
        if (item.rank === 1) {
          return (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-amber-400/25 to-yellow-500/25 text-amber-600 dark:text-amber-300 font-black text-sm border border-amber-400/50 shadow-sm">
                🥇 1
              </span>
            </div>
          );
        }
        if (item.rank === 2) {
          return (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300/30 text-slate-700 dark:text-slate-200 font-black text-sm border border-slate-400/50 shadow-sm">
                🥈 2
              </span>
            </div>
          );
        }
        if (item.rank === 3) {
          return (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 font-black text-sm border border-amber-700/50 shadow-sm">
                🥉 3
              </span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center">
            <span className="font-bold text-sm text-[var(--text-secondary)]">#{item.rank}</span>
          </div>
        );
      },
    },
    {
      header: 'O\'quvchi',
      accessor: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl neu-raised flex items-center justify-center font-bold text-xs text-indigo-500">
            {item.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">{item.fullName}</p>
            <p className="text-xs text-[var(--text-muted)]">Baholangan darslar: {item.totalGradesCount} ta</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Guruh',
      accessor: (item) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5">
          {item.groupName}
        </span>
      ),
    },
    {
      header: 'O\'rtacha Ball',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5 font-black text-sm">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="font-mono text-base">{item.averageScore}</span>
          <span className="text-xs text-[var(--text-muted)] font-normal">/ 100</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold tracking-tight">O'quvchilar Reytingi</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Jonli Hisob
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            O'qituvchilar tomonidan darslarda qo'yilgan haqiqiy baholar asosida hisoblangan reyting
          </p>
        </div>

        {/* Period Tabs: Weekly / Monthly */}
        <Tabs
          tabs={[
            { id: 'weekly', label: 'Haftalik', icon: <Calendar className="w-4 h-4" /> },
            { id: 'monthly', label: 'Oylik', icon: <Trophy className="w-4 h-4" /> },
          ]}
          activeTab={period}
          onChange={(tab) => setPeriod(tab as 'weekly' | 'monthly')}
        />
      </div>

      {/* Podium for Top 3 Students */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 items-end">
          {/* 2nd Place */}
          {top3[1] && (
            <Card variant="raised" className="relative text-center order-2 sm:order-1 border-t-4 border-slate-400 bg-gradient-to-b from-slate-400/5 to-transparent">
              <div className="inline-flex p-3 rounded-full bg-slate-300/30 text-slate-700 dark:text-slate-200 text-xl font-black mb-2 border border-slate-400/50 shadow-sm">
                🥈 2
              </div>
              <h4 className="font-extrabold text-base text-[var(--text-primary)]">{top3[1].fullName}</h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{top3[1].groupName}</p>
              <div className="mt-3 py-1.5 px-3 rounded-xl neu-inset inline-flex items-center gap-1 font-bold text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {top3[1].averageScore} ball
              </div>
            </Card>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <Card variant="raised-lg" className="relative text-center order-1 sm:order-2 border-t-4 border-amber-400 sm:-translate-y-3 bg-gradient-to-b from-amber-400/10 to-transparent shadow-[var(--shadow-raised-lg)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 flex items-center gap-1 shadow-md">
                  <Crown className="w-3 h-3" /> Peshqadam
                </span>
              </div>
              <div className="inline-flex p-3.5 rounded-full bg-amber-400/30 text-amber-600 dark:text-amber-300 text-2xl font-black mb-2 border border-amber-400/50 shadow-sm mt-1">
                🥇 1
              </div>
              <h4 className="font-extrabold text-lg text-[var(--text-primary)]">{top3[0].fullName}</h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{top3[0].groupName}</p>
              <div className="mt-3 py-2 px-4 rounded-xl neu-inset inline-flex items-center gap-1.5 font-extrabold text-base text-amber-600 dark:text-amber-400">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                {top3[0].averageScore} ball
              </div>
            </Card>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <Card variant="raised" className="relative text-center order-3 sm:order-3 border-t-4 border-amber-700 bg-gradient-to-b from-amber-700/5 to-transparent">
              <div className="inline-flex p-3 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 text-xl font-black mb-2 border border-amber-700/50 shadow-sm">
                🥉 3
              </div>
              <h4 className="font-extrabold text-base text-[var(--text-primary)]">{top3[2].fullName}</h4>
              <p className="text-xs text-[var(--text-secondary)] font-medium">{top3[2].groupName}</p>
              <div className="mt-3 py-1.5 px-3 rounded-xl neu-inset inline-flex items-center gap-1 font-bold text-sm">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {top3[2].averageScore} ball
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Filter by Group */}
      <Card variant="raised-sm" className="p-4">
        <div className="max-w-xs">
          <Select
            label="Guruh bo'yicha saralash"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Top 10 Table */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base flex items-center gap-2">
          <Medal className="w-5 h-5 text-indigo-500" /> Top 10 o'quvchi ro'yxati
        </h3>
        <Table
          data={ratings}
          columns={columns}
          keyExtractor={(item) => item.studentId}
          isLoading={isLoading}
          emptyMessage="Ushbu oraliqda baholangan o'quvchilar mavjud emas"
        />
      </div>
    </div>
  );
};
