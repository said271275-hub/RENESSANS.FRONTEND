import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Users,
  GraduationCap,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Layers,
  Eye,
  Info,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { Attendance, Group, Teacher, AttendanceStatus } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { DatePicker } from '../../components/ui/DatePicker';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminAttendancePage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Group for detailed view (Read-only)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString);
  const [existingAttendances, setExistingAttendances] = useState<Attendance[]>([]);
  const [groupAttendanceLoading, setGroupAttendanceLoading] = useState(false);

  // 1. Initial Load: Fetch Groups
  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Group[]>('/admin/groups');
      setGroups(data);
    } catch (err: any) {
      console.error('Guruhlarni yuklashda xatolik:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. Load attendance taken by the teacher for this group & date
  useEffect(() => {
    if (!selectedGroup) return;

    const fetchGroupAttendance = async () => {
      try {
        setGroupAttendanceLoading(true);
        const attendances = await api.get<Attendance[]>('/admin/attendance', {
          groupId: selectedGroup.id,
          date: selectedDate,
        });
        setExistingAttendances(attendances || []);
      } catch (err) {
        console.error(err);
      } finally {
        setGroupAttendanceLoading(false);
      }
    };

    fetchGroupAttendance();
  }, [selectedGroup, selectedDate]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.teacher?.user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  // Map of studentId -> Attendance record
  const attendanceRecordMap = useMemo(() => {
    const map: Record<number, Attendance> = {};
    existingAttendances.forEach((a) => {
      map[a.studentId] = a;
    });
    return map;
  }, [existingAttendances]);

  // Stats for currently selected group
  const groupStats = useMemo(() => {
    const total = selectedGroup?.students?.length || 0;
    const records = existingAttendances;
    const isRecorded = records.length > 0;

    let keldi = 0;
    let kelmadi = 0;
    let sababli = 0;

    records.forEach((a) => {
      if (a.status === 'KELDI') keldi++;
      else if (a.status === 'KELMADI') kelmadi++;
      else if (a.status === 'SABABLI') sababli++;
    });

    const percent = total > 0 && isRecorded ? Math.round((keldi / total) * 100) : 0;
    return { total, keldi, kelmadi, sababli, percent, isRecorded };
  }, [selectedGroup, existingAttendances]);

  return (
    <div className="space-y-6">
      {selectedGroup ? (
        /* ================= READ-ONLY GROUP ATTENDANCE DETAIL VIEW ================= */
        <div className="space-y-5">
          {/* Top Bar with Return button & Date picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => setSelectedGroup(null)}
                icon={<ArrowLeft className="w-4 h-4" />}
                className="!p-2.5 rounded-2xl neu-button"
              >
                Guruhlarga qaytish
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                    {selectedGroup.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Ko'rish rejimi
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2 mt-0.5 font-medium">
                  <span className="text-red-500 font-bold">
                    O'qituvchi: {selectedGroup.teacher?.user.fullName || 'Biriktirilmagan'}
                  </span>
                  <span>•</span>
                  <span>{selectedGroup.schedule}</span>
                </p>
              </div>
            </div>

            {/* Date picker for Admin */}
            <div className="w-56 self-end sm:self-auto">
              <DatePicker
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>

          {/* Teacher Attendance Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-500 dark:text-indigo-400 font-semibold flex items-center gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>
              Davomat o'qituvchi tomonidan o'z panelida olinadi. Ushbu sahifada admin faqat o'qituvchi kiritgan natijalarni kuzatadi.
            </span>
          </div>

          {/* Group Stats Card */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] text-center">
              <p className="text-xs text-[var(--text-muted)] font-semibold">Jami o'quvchi</p>
              <p className="text-xl font-black text-[var(--text-primary)] mt-1">{groupStats.total}</p>
            </div>
            <div className="p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] text-center">
              <p className="text-xs text-emerald-500 font-bold">Keldi</p>
              <p className="text-xl font-black text-emerald-500 mt-1">{groupStats.keldi}</p>
            </div>
            <div className="p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] text-center">
              <p className="text-xs text-sky-500 font-bold">Sababli</p>
              <p className="text-xl font-black text-sky-500 mt-1">{groupStats.sababli}</p>
            </div>
            <div className="p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] text-center">
              <p className="text-xs text-rose-500 font-bold">Kelmadi</p>
              <p className="text-xl font-black text-rose-500 mt-1">{groupStats.kelmadi}</p>
            </div>
            <div className="p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] text-center col-span-2 sm:col-span-1">
              <p className="text-xs text-purple-500 font-bold">Davomat</p>
              <p className="text-xl font-black text-purple-500 mt-1">{groupStats.percent}%</p>
            </div>
          </div>

          {/* Students List in Group with Read-only Status Badges */}
          <Card variant="raised" className="p-0 overflow-hidden border border-[var(--border-subtle)]">
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                O'quvchilar ro'yxati va davomati ({selectedGroup.students?.length || 0} ta)
              </p>
              {!groupStats.isRecorded && !groupAttendanceLoading && (
                <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Bu sana uchun o'qituvchi hali davomat olmagan
                </span>
              )}
            </div>

            {groupAttendanceLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            ) : !selectedGroup.students || selectedGroup.students.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)]">
                <Users className="w-12 h-12 mx-auto opacity-30 mb-2" />
                <p className="text-sm font-semibold">Ushbu guruhda o'quvchilar mavjud emas.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {selectedGroup.students.map((student, idx) => {
                  const record = attendanceRecordMap[student.id];
                  const status = record?.status;

                  return (
                    <div
                      key={student.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-xs font-mono font-bold text-[var(--text-muted)]">
                          #{idx + 1}
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center font-bold text-xs shadow-inner">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[var(--text-primary)]">
                            {student.fullName}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] font-mono">
                            {student.phone}
                          </p>
                        </div>
                      </div>

                      {/* Read-Only Status Badge */}
                      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                        {status === 'KELDI' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Keldi
                          </span>
                        ) : status === 'SABABLI' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-sky-500/15 text-sky-600 border border-sky-500/30 shadow-sm">
                            <AlertCircle className="w-3.5 h-3.5" /> Sababli
                          </span>
                        ) : status === 'KELMADI' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-500/15 text-rose-600 border border-rose-500/30 shadow-sm">
                            <XCircle className="w-3.5 h-3.5" /> Kelmadi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/5 text-[var(--text-muted)] border border-[var(--border-subtle)]">
                            <HelpCircle className="w-3.5 h-3.5 opacity-60" /> Belgilanmagan
                          </span>
                        )}
                        {(status === 'KELMADI' || status === 'SABABLI') && (
                          record?.reason?.trim() ? (
                            <div className="max-w-full text-left sm:max-w-64 sm:text-right">
                              <p
                                className="max-w-[280px] truncate text-xs font-medium text-[var(--text-secondary)]"
                                title={record.reason}
                              >
                                {record.reason}
                              </p>
                              <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                {record.reasonByTeacher?.user.fullName || 'O‘qituvchi'}
                                {record.reasonAt
                                  ? ` · ${new Date(record.reasonAt).toLocaleString('uz-UZ', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    })}`
                                  : ''}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-[var(--text-muted)]">Sabab kiritilmagan</p>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      ) : (
        /* ================= GROUPS CARDS GRID VIEW ================= */
        <div className="space-y-5">
          {/* Category Tag */}
          <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] -mb-3">
            groups
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
                  Guruhlar Davomati
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Ko'rish rejimi
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                O'qituvchilar tomonidan olingan guruhlar davomatini ko'rish
              </p>
            </div>
          </div>

          {/* Search Bar matching Image */}
          <div className="space-y-2">
            <div className="relative">
              <Input
                placeholder="Guruh nomini qidiring..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neu-input !py-3 !px-4 text-sm border border-[var(--border-subtle)] rounded-2xl"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-semibold pl-1">
              Jami: <span className="font-extrabold text-[var(--text-primary)]">{filteredGroups.length}</span> ta guruh
            </p>
          </div>

          {/* Groups Cards Grid - 5 columns */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card variant="raised" className="py-12 text-center text-[var(--text-muted)] border border-[var(--border-subtle)]">
              <Layers className="w-12 h-12 mx-auto opacity-40 mb-3" />
              <p className="text-base font-bold">Guruhlar topilmadi</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Qidiruv parametrini o'zgartiring.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredGroups.map((group) => {
                const letter = group.name.trim().charAt(0).toUpperCase() || 'G';
                const studentCount = group.students?.length || 0;
                return (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    className="group relative p-3.5 rounded-2xl neu-raised border border-[var(--border-subtle)] hover:scale-[1.02] active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
                  >
                    <div className="space-y-2.5">
                      {/* Top Row: Square Avatar Badge */}
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 flex items-center justify-center font-black text-sm shadow-inner">
                        {letter}
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
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-1 font-medium">
                          {group.teacher?.user?.fullName || 'Ustoz biriktirilmagan'}
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
          )}
        </div>
      )}
    </div>
  );
};
