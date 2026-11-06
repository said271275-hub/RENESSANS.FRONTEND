import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Users, Layers, BookOpen, Clock, ArrowRight, Sparkles, Trash2, Phone, GraduationCap } from 'lucide-react';
import { api } from '../../api/client';
import { Group } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';

export const TeacherGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'groups' | 'students'>('groups');
  const [isLoading, setIsLoading] = useState(true);

  // New Group Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [schedule, setSchedule] = useState('Dush-Chor-Jum 14:00 - 16:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Group[]>('/teacher/groups');
      setGroups(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !schedule.trim()) {
      setFormError('Guruh nomi va dars jadvalini kiriting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.post('/teacher/groups', {
        name: groupName.trim(),
        schedule: schedule.trim(),
      });
      setIsModalOpen(false);
      setGroupName('');
      fetchGroups();
    } catch (err: any) {
      setFormError(err.message || 'Guruh yaratishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, groupId: number, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Haqiqatan ham "${name}" guruhini o'chirmoqchimisiz? Guruhdagi o'quvchilar saqlanib qoladi.`)) {
      return;
    }

    try {
      await api.delete(`/teacher/groups/${groupId}`);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (err: any) {
      alert(err.message || 'Guruhni o\'chirishda xatolik yuz berdi.');
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Flattened students list for "O'quvchilar" tab
  const allStudents = groups.flatMap((g) =>
    (g.students || []).map((s) => ({
      ...s,
      groupName: g.name,
      groupId: g.id,
    }))
  );

  const filteredStudents = allStudents.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery) ||
      s.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Category Tag matching image */}
      <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] -mb-3">
        groups
      </div>

      {/* Top Header matching Image 2 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Guruhlar
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            Guruhlarni boshqarish
          </p>
        </div>

        {/* Top Right Controls: Switcher Tabs & New Group Button */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Switcher Tab */}
          <div className="p-1 rounded-2xl neu-inset flex items-center border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'students'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> O'quvchilar
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'groups'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Guruhlarim
            </button>
          </div>

          {/* New Group Button */}
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
            className="!bg-red-600 hover:!bg-red-700 !text-white shadow-lg rounded-xl font-bold"
          >
            Yangi guruh
          </Button>
        </div>
      </div>

      {/* Search Input Bar & Count Indicator matching Image 2 */}
      <div className="space-y-2">
        <div className="relative">
          <Input
            placeholder="Guruh nomini qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-input !py-3 !px-4 text-sm border border-[var(--border-subtle)] rounded-2xl"
          />
        </div>
        <p className="text-xs text-[var(--text-secondary)] pl-1 font-semibold">
          Jami: <span className="font-extrabold text-[var(--text-primary)]">
            {activeTab === 'groups' ? filteredGroups.length : filteredStudents.length}
          </span> {activeTab === 'groups' ? 'ta guruh' : 'ta o\'quvchi'}
        </p>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'groups' ? (
        /* Groups Grid - exactly as shown in Image 2 */
        isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card variant="raised" className="py-12 text-center text-[var(--text-muted)] border border-[var(--border-subtle)]">
            <Layers className="w-12 h-12 mx-auto opacity-40 mb-3" />
            <p className="text-base font-bold">Guruhlar topilmadi</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Qidiruv parametrini o'zgartiring yoki yangi guruh yarating.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredGroups.map((group) => {
              const letter = group.name.trim().charAt(0).toUpperCase() || 'G';
              const studentCount = group.students?.length || 0;
              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/teacher/groups/${group.id}`)}
                  className="group relative p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Square Avatar Badge with Letter & Delete Button */}
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center font-black text-sm shadow-inner">
                        {letter}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteGroup(e, group.id, group.name)}
                        className="p-1 rounded-lg neu-button text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        title="Guruhni o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Group Name & Student count */}
                    <div>
                      <h3 className="font-extrabold text-sm text-[var(--text-primary)] group-hover:text-red-400 transition-colors truncate" title={group.name}>
                        {group.name}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-0.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-red-500" />
                        <span>{studentCount} o'quvchi</span>
                      </p>
                    </div>
                  </div>

                  {/* Schedule Footer */}
                  <div className="pt-2.5 mt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <span className="truncate flex items-center gap-1 font-medium text-[10px]">
                      <Clock className="w-2.5 h-2.5 text-red-400" /> {group.schedule}
                    </span>
                    <ArrowRight className="w-3 h-3 text-red-500 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Students List Tab */
        isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card variant="raised" className="py-12 text-center text-[var(--text-muted)] border border-[var(--border-subtle)]">
            <Users className="w-12 h-12 mx-auto opacity-40 mb-3" />
            <p className="text-base font-bold">O'quvchilar topilmadi</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Guruhlaringizda hozircha o'quvchilar mavjud emas.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => navigate(`/teacher/groups/${student.groupId}`)}
                className="p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] hover:scale-[1.01] transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs shadow-inner">
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">
                      {student.fullName}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                      <span className="text-red-400 font-semibold">{student.groupName}</span>
                      {student.phone && (
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Phone className="w-3 h-3" /> {student.phone}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Faol
                  </span>
                  <ArrowRight className="w-4 h-4 text-red-500" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add Group Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yangi guruh yaratish"
        description="Guruh nomi va haftalik dars jadvalini belgilang"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl neu-inset bg-red-500/10 text-red-600 text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Guruh nomi"
            placeholder="Masalan: Frontend 2 yoki Matematika - AF-6"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          <Input
            label="Dars jadvali"
            placeholder="Masalan: Dush-Chor-Jum 14:00 - 16:00"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
            <Button type="button" variant="default" onClick={() => setIsModalOpen(false)}>
              Bekor qilish
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} className="!bg-red-600 hover:!bg-red-700 !text-white">
              Guruhni yaratish
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

