import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, Star, CheckCircle2, AlertCircle, Plus, Send, History, Sparkles, Check } from 'lucide-react';
import { api } from '../../api/client';
import { Group, Student, Grade } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Table, Column } from '../../components/ui/Table';

const QUICK_SCORES = [100, 95, 90, 85, 80, 75, 70, 60];
const QUICK_COMMENTS = [
  "Darsda juda faol qatnashdi va mashqlarni a'lo bajardi 👏",
  "Mavzuni yaxshi o'zlashtirdi, faollikni oshirish kerak 👍",
  "Uy vazifasi to'liq, amaliy mashg'ulotda biroz sustlik bor",
  "Mavzuni qo'shimcha takrorlash va mustahkamlash tavsiya etiladi 📚",
];

export const TeacherGradingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialGroupId = searchParams.get('groupId') || '';

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(initialGroupId);
  const [students, setStudents] = useState<Student[]>([]);

  // Grade Form State
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [score, setScore] = useState<string>('90');
  const [comment, setComment] = useState<string>('Darsda juda faol qatnashdi va mashqlarni a\'lo bajardi 👏');
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [gradesHistory, setGradesHistory] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch groups
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

  // Update students when group changes
  useEffect(() => {
    if (!selectedGroupId) return;
    const currentGroup = groups.find((g) => g.id === Number(selectedGroupId));
    const groupStudents = currentGroup?.students || [];
    setStudents(groupStudents);
    if (groupStudents.length > 0) {
      setSelectedStudentId(String(groupStudents[0].id));
    } else {
      setSelectedStudentId('');
    }
  }, [selectedGroupId, groups]);

  // Fetch Teacher's recent grades
  const fetchGradesHistory = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Grade[]>('/teacher/grades');
      setGradesHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGradesHistory();
  }, []);

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !score || !date) {
      setErrorMessage('Iltimos, o\'quvchi, baho va sanani to\'ldiring.');
      return;
    }

    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 1 || numScore > 100) {
      setErrorMessage('Baho 1 dan 100 gacha bo\'lishi kerak.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await api.post('/teacher/grades', {
        studentId: Number(selectedStudentId),
        score: numScore,
        comment: comment.trim(),
        date,
      });

      const studentName = students.find(s => s.id === Number(selectedStudentId))?.fullName || "O'quvchi";
      setSuccessMessage(`${studentName}ga ${numScore} ball muvaffaqiyatli qo'yildi va reytingga qo'shildi!`);
      setTimeout(() => setSuccessMessage(null), 4000);

      // Refresh history
      fetchGradesHistory();
    } catch (err: any) {
      setErrorMessage(err.message || 'Bahoni saqlashda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (sc >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30';
  };

  const columns: Column<Grade>[] = [
    {
      header: 'O\'quvchi',
      accessor: (g) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl neu-raised flex items-center justify-center font-bold text-xs text-indigo-500">
            {g.student?.fullName?.charAt(0) || 'O'}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">{g.student?.fullName}</p>
            <p className="text-xs text-[var(--text-muted)]">{g.student?.group?.name || 'Guruh'}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Baho (Ball)',
      accessor: (g) => (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl font-black text-sm border ${getScoreColor(g.score)}`}>
          <Star className="w-4 h-4 fill-current" />
          {g.score}
          <span className="text-[10px] font-normal opacity-70">/100</span>
        </div>
      ),
    },
    {
      header: 'Izoh / Sharh',
      accessor: (g) => <span className="text-xs text-[var(--text-secondary)]">{g.comment || '-'}</span>,
    },
    {
      header: 'Sana',
      accessor: (g) => <span className="text-xs font-mono text-[var(--text-muted)]">{g.date}</span>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight">O'quvchilarni baholash</h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Jonli Reyting
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Dars natijalari bo'yicha baholang. Ushbu ballar to'g'ridan-to'g'ri umumiy o'quvchilar reytingida aks etadi.
        </p>
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

      {/* Grading Form Card */}
      <Card variant="raised-lg" className="border border-[var(--border-subtle)]">
        <form onSubmit={handleGradeSubmit} className="space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-subtle)]">
            <Award className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-base">Yangi baho qo'yish formasi</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <Select
              label="1. Guruhni tanlang"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.students?.length || 0} o'quvchi)
                </option>
              ))}
            </Select>

            <Select
              label="2. O'quvchini tanlang"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={students.length === 0}
            >
              {students.length === 0 ? (
                <option value="">Guruhda o'quvchi yo'q</option>
              ) : (
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))
              )}
            </Select>

            <Input
              label="3. Dars sanasi"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Quick Score Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] pl-1">
              4. Bahoni belgilang (1 - 100 ball)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {QUICK_SCORES.map((sVal) => {
                const isSelected = score === String(sVal);
                return (
                  <button
                    key={sVal}
                    type="button"
                    onClick={() => setScore(String(sVal))}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? 'neu-inset text-indigo-600 dark:text-indigo-400 bg-indigo-500/20 border border-indigo-500/40 shadow-[var(--shadow-inset)] scale-105'
                        : 'neu-button text-[var(--text-secondary)] hover:text-indigo-500'
                    }`}
                  >
                    {sVal} ball
                  </button>
                );
              })}
              <div className="w-28 ml-2">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="Boshqa ball"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="text-center font-black"
                />
              </div>
            </div>
          </div>

          {/* Quick Comment Chips & Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] pl-1">
              5. O'qituvchi sharhi / tavsiyasi
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {QUICK_COMMENTS.map((cVal, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setComment(cVal)}
                  className={`text-[11px] px-3 py-1.5 rounded-xl text-left transition-all ${
                    comment === cVal
                      ? 'neu-inset text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/30'
                      : 'neu-button text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cVal}
                </button>
              ))}
            </div>
            <Input
              placeholder="O'quvchi darsdagi faolligi, kamchiliklari yoki yutuqlari haqida izoh..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-[var(--border-subtle)]">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              disabled={students.length === 0}
              icon={<Send className="w-4 h-4" />}
              className="shadow-[var(--shadow-raised)]"
            >
              Bahoni saqlash va reytingga qo'shish
            </Button>
          </div>
        </form>
      </Card>

      {/* Recent Grades History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-base">Siz qo'ygan so'nggi baholar jurnali</h3>
          </div>
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Jami {gradesHistory.length} ta baho
          </span>
        </div>

        <Table
          data={gradesHistory}
          columns={columns}
          keyExtractor={(g) => g.id}
          isLoading={isLoading}
          emptyMessage="Hozircha baholar qo'yilmagan"
        />
      </div>
    </div>
  );
};
