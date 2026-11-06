import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCheck, Save, CheckCircle2, XCircle, AlertCircle, Users, Pencil, X } from 'lucide-react';
import { api } from '../../api/client';
import { Group, Student, Attendance, AttendanceStatus } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { DatePicker } from '../../components/ui/DatePicker';

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const TeacherAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGroupId = searchParams.get('groupId') || '';

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString);

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, AttendanceStatus>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<Record<number, Attendance>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [reasonStudent, setReasonStudent] = useState<Student | null>(null);
  const [reasonDraft, setReasonDraft] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isSavingReason, setIsSavingReason] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch Teacher's groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await api.get<Group[]>('/teacher/groups');
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  // 2. When selectedGroupId or selectedDate changes, fetch group students & existing attendance
  useEffect(() => {
    if (!selectedGroupId || !selectedDate) return;

    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        // Find selected group from state or refetch
        const currentGroup = groups.find((g) => g.id === Number(selectedGroupId));
        const groupStudents = currentGroup?.students || [];
        setStudents(groupStudents);

        // Fetch existing attendance records for this group & date
        const existingRecords = await api.get<Attendance[]>('/teacher/attendance', {
          groupId: selectedGroupId,
          date: selectedDate,
        });

        // Populate attendanceMap with existing or default
        const newMap: Record<number, AttendanceStatus> = {};
        const newRecords: Record<number, Attendance> = {};
        groupStudents.forEach((student) => {
          const found = existingRecords.find((r) => r.studentId === student.id);
          newMap[student.id] = found ? found.status : 'KELDI';
          if (found) newRecords[student.id] = found;
        });

        setAttendanceMap(newMap);
        setAttendanceRecords(newRecords);
      } catch (err: any) {
        setErrorMessage(err.message || 'Davomat ma\'lumotlarini yuklashda xatolik.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedGroupId, selectedDate, groups]);

  // Set single student status
  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    const savedReason = attendanceRecords[studentId]?.reason;
    if (status !== 'SABABLI' && savedReason) {
      const student = students.find((item) => item.id === studentId);
      if (!window.confirm(`${student?.fullName || 'O‘quvchi'} uchun yozilgan sababni o‘chirishni tasdiqlaysizmi?`)) {
        return;
      }
      setAttendanceRecords((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          reason: null,
          reasonByTeacherId: null,
          reasonByTeacher: null,
          reasonAt: null,
        },
      }));
    }

    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
    setSuccessMessage(null);
  };

  // "Hammasini keldi deb belgilash"
  const markAllAsPresent = () => {
    const hasReasons = Object.values(attendanceRecords).some((record) => Boolean(record.reason));
    if (hasReasons && !window.confirm('Yozilgan sabablar o‘chiriladi. Barcha o‘quvchilarni "Keldi" deb belgilaysizmi?')) {
      return;
    }

    const updatedMap: Record<number, AttendanceStatus> = {};
    students.forEach((s) => {
      updatedMap[s.id] = 'KELDI';
    });
    setAttendanceMap(updatedMap);
    setAttendanceRecords((prev) => Object.fromEntries(
      Object.entries(prev).map(([studentId, record]) => [
        studentId,
        { ...record, reason: null, reasonByTeacherId: null, reasonByTeacher: null, reasonAt: null },
      ])
    ));
    setSuccessMessage('Barcha o\'quvchilar "Keldi" deb belgilandi. Saqlash tugmasini bosing.');
  };

  const openReasonDialog = (student: Student) => {
    setReasonStudent(student);
    setReasonDraft(attendanceRecords[student.id]?.reason || '');
    setReasonError(null);
  };

  const closeReasonDialog = () => {
    if (isSavingReason) return;
    setReasonStudent(null);
    setReasonDraft('');
    setReasonError(null);
  };

  useEffect(() => {
    if (!reasonStudent) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeReasonDialog();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reasonStudent, isSavingReason]);

  const handleSaveReason = async () => {
    if (!reasonStudent || !selectedGroupId || !selectedDate) return;

    const cleanReason = reasonDraft.trim();
    if (!cleanReason) {
      setReasonError('Sabab matnini kiriting.');
      return;
    }
    if (cleanReason.length > 300) {
      setReasonError('Sabab 300 belgidan oshmasligi kerak.');
      return;
    }

    try {
      setIsSavingReason(true);
      setReasonError(null);
      const savedRecord = await api.post<Attendance>('/teacher/attendance/reason', {
        groupId: Number(selectedGroupId),
        studentId: reasonStudent.id,
        date: selectedDate,
        reason: cleanReason,
      });

      setAttendanceRecords((prev) => ({ ...prev, [reasonStudent.id]: savedRecord }));
      setAttendanceMap((prev) => ({ ...prev, [reasonStudent.id]: 'SABABLI' }));
      setSuccessMessage(`${reasonStudent.fullName} uchun sabab saqlandi.`);
      setReasonStudent(null);
      setReasonDraft('');
    } catch (err: any) {
      setReasonError(err.message || 'Sababni saqlashda xatolik yuz berdi.');
    } finally {
      setIsSavingReason(false);
    }
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (!selectedGroupId || !selectedDate) return;

    try {
      setIsSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const records = students.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id] || 'KELDI',
      }));

      await api.post('/teacher/attendance', {
        groupId: Number(selectedGroupId),
        date: selectedDate,
        records,
      });

      setSuccessMessage('Davomat muvaffaqiyatli saqlandi!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Davomatni saqlashda xatolik yuz berdi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculation of present vs total
  const stats = React.useMemo(() => {
    const total = students.length;
    let keldi = 0, kelmadi = 0, sababli = 0;
    Object.values(attendanceMap).forEach((st) => {
      if (st === 'KELDI') keldi++;
      else if (st === 'KELMADI') kelmadi++;
      else if (st === 'SABABLI') sababli++;
    });
    return { total, keldi, kelmadi, sababli };
  }, [students, attendanceMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Davomat belgilash</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Darsda qatnashayotgan shogirdlaringiz davomatini belgilang va saqlang
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="default"
            onClick={markAllAsPresent}
            disabled={students.length === 0}
            icon={<CheckCheck className="w-4 h-4 text-emerald-600" />}
            className="shadow-[var(--shadow-raised-sm)]"
          >
            Hammasini keldi deb belgilash
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSaveAttendance}
            isLoading={isSaving}
            disabled={students.length === 0}
            icon={<Save className="w-4 h-4" />}
            className="shadow-[var(--shadow-raised)]"
          >
            Saqlash
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl neu-inset bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-2xl neu-inset bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Group & Date Selection Card */}
      <Card variant="raised-sm" className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Select
            label="Guruhni tanlang"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.students?.length || 0} o'quvchi)
              </option>
            ))}
          </Select>

          <DatePicker
            label="Dars sanasi"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          <div className="flex flex-col justify-end">
            <div className="p-2.5 rounded-xl neu-inset flex items-center justify-around text-xs font-bold border border-[var(--border-subtle)]">
              <span className="text-emerald-600 dark:text-emerald-400">
                Keldi: {stats.keldi}
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Kelmadi: {stats.kelmadi}
              </span>
              <span className="text-sky-600 dark:text-sky-400">
                Sababli: {stats.sababli}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Students Attendance List */}
      <Card variant="raised" className="p-0 overflow-hidden">
        {students.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)]">
            <Users className="w-10 h-10 mx-auto opacity-50 mb-2" />
            <p className="text-sm font-semibold">Ushbu guruhda o'quvchilar mavjud emas.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            <div className="py-3.5 px-6 bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              <span>O'quvchi (F.I.SH.)</span>
              <span>Davomat holati</span>
            </div>

            {students.map((student, idx) => {
              const currentStatus = attendanceMap[student.id] || 'KELDI';
              return (
                <div
                  key={student.id}
                  className="py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="text-xs font-bold text-[var(--text-muted)] w-5 font-mono">
                      {idx + 1}
                    </span>
                    <div className="w-9 h-9 rounded-xl neu-raised flex items-center justify-center font-bold text-xs text-indigo-500">
                      {student.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--text-primary)]">
                        {student.fullName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-mono">
                        {student.phone}
                      </p>
                      {currentStatus === 'SABABLI' && attendanceRecords[student.id]?.reason && (
                        <p
                          className="mt-1 max-w-[240px] truncate text-[11px] font-medium text-indigo-600 dark:text-indigo-300"
                          title={attendanceRecords[student.id].reason || undefined}
                        >
                          Sabab: {attendanceRecords[student.id].reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 4 Status Buttons for each student */}
                  <div className="grid grid-cols-2 items-center gap-1.5 self-end sm:flex sm:flex-wrap sm:gap-2 sm:self-auto">
                    {/* KELDI */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'KELDI')}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'KELDI'
                          ? 'neu-inset text-emerald-700 dark:text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 shadow-[var(--shadow-inset)]'
                          : 'neu-button text-[var(--text-secondary)] hover:text-emerald-600'
                      }`}
                    >
                      ✓ Keldi
                    </button>

                    {/* KELMADI */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(student.id, 'KELMADI')}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'KELMADI'
                          ? 'neu-inset text-rose-700 dark:text-rose-400 bg-rose-500/20 border border-rose-500/40 shadow-[var(--shadow-inset)]'
                          : 'neu-button text-[var(--text-secondary)] hover:text-rose-600'
                      }`}
                    >
                      ✗ Kelmadi
                    </button>

                    {/* Reason */}
                    <button
                      type="button"
                      onClick={() => openReasonDialog(student)}
                      title={attendanceRecords[student.id]?.reason ? 'Sababni ko‘rish/tahrirlash' : 'Sabab yozish'}
                      aria-label={attendanceRecords[student.id]?.reason ? 'Sababni ko‘rish/tahrirlash' : 'Sabab yozish'}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        currentStatus === 'SABABLI'
                          ? 'neu-inset text-indigo-700 dark:text-indigo-300 bg-indigo-500/15 border border-indigo-500/40 shadow-[var(--shadow-inset)]'
                          : 'neu-button text-indigo-600 dark:text-indigo-300 hover:text-indigo-700'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" />{attendanceRecords[student.id]?.reason ? 'Sabab' : 'Sabab yozish'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {reasonStudent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeReasonDialog();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-reason-title"
            className="w-full max-w-lg rounded-3xl neu-raised border border-[var(--border-subtle)] bg-[var(--bg-color)] p-5 shadow-2xl transition-all sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="attendance-reason-title" className="text-lg font-extrabold text-[var(--text-primary)]">
                  Sabab yozish
                </h2>
                <p className="mt-1 text-sm font-semibold text-[var(--text-secondary)]">
                  {reasonStudent.fullName}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Dars sanasi: {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('uz-UZ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReasonDialog}
                disabled={isSavingReason}
                aria-label="Yopish"
                className="rounded-xl p-2 text-[var(--text-muted)] transition hover:bg-black/5 hover:text-[var(--text-primary)] disabled:opacity-50 dark:hover:bg-white/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label htmlFor="attendance-reason" className="mb-2 block text-xs font-bold text-[var(--text-secondary)]">
              Sabab matni
            </label>
            <textarea
              id="attendance-reason"
              value={reasonDraft}
              onChange={(event) => {
                setReasonDraft(event.target.value);
                if (reasonError) setReasonError(null);
              }}
              maxLength={300}
              rows={5}
              placeholder="Masalan: kasal bo'lgan, oilaviy sabab..."
              className="w-full resize-y rounded-2xl neu-inset border border-[var(--border-subtle)] bg-transparent px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/15 placeholder:text-[var(--text-muted)]"
              autoFocus
            />
            <div className="mt-1 flex min-h-5 items-center justify-between gap-3">
              {reasonError ? (
                <p role="alert" className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {reasonError}
                </p>
              ) : <span />}
              <p className="shrink-0 text-xs text-[var(--text-muted)]">{reasonDraft.length}/300</p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="default" onClick={closeReasonDialog} disabled={isSavingReason}>
                Bekor qilish
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveReason}
                isLoading={isSavingReason}
                icon={<Save className="h-4 w-4" />}
                className="!bg-indigo-600 !text-white hover:!bg-indigo-700"
              >
                Saqlash
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
