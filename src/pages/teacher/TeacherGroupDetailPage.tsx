import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Trophy,
  Check,
  Zap,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../api/client';
import { Group, EvaluatedStudent, GroupEvaluationResponse } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
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

export const TeacherGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState<string>(groupId || '');
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString);

  const [data, setData] = useState<GroupEvaluationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [updatingStudentId, setUpdatingStudentId] = useState<number | null>(null);

  // 1. Fetch all teacher groups for the dropdown (Image 1 style)
  useEffect(() => {
    const fetchTeacherGroups = async () => {
      try {
        const groups = await api.get<Group[]>('/teacher/groups');
        setAllGroups(groups);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTeacherGroups();
  }, []);

  // 2. Fetch evaluation data for current group & date
  const fetchEvaluation = async (gid: string, dt: string) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setData(null);
      const res = await api.get<GroupEvaluationResponse>(
        `/teacher/groups/${gid}/evaluation`,
        { date: dt }
      );
      setData(res);
    } catch (err) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Baholash ma\'lumotlarini yuklashda xatolik.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      setCurrentGroupId(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    if (currentGroupId) {
      fetchEvaluation(currentGroupId, selectedDate);
    }
  }, [currentGroupId, selectedDate]);

  // Handle switching group from the top dropdown
  const handleGroupChange = (newGid: string) => {
    setCurrentGroupId(newGid);
    navigate(`/teacher/groups/${newGid}`);
  };

  // Evaluate single student (20 ball, 10 ball, or 0 ball)
  const handleEvaluateStudent = async (student: EvaluatedStudent, score: 20 | 10 | 0) => {
    if (!currentGroupId) return;

    // Optimistic UI update
    const previousScore = student.currentScore;
    const scoreDiff = score - (previousScore ?? 0);

    const updatedStudents = (data?.students || []).map((s) => {
      if (s.id !== student.id) return s;

      const newGreen = s.greenCount + (score === 20 ? 1 : 0) - (previousScore === 20 ? 1 : 0);
      const newBlue = s.blueCount + (score === 10 ? 1 : 0) - (previousScore === 10 ? 1 : 0);
      const newRed = s.redCount + (score === 0 ? 1 : 0) - (previousScore === 0 ? 1 : 0);

      return {
        ...s,
        totalScore: Math.max(0, s.totalScore + scoreDiff),
        greenCount: Math.max(0, newGreen),
        blueCount: Math.max(0, newBlue),
        redCount: Math.max(0, newRed),
        currentScore: score,
      };
    });

    // Re-rank by totalScore
    updatedStudents.sort((a, b) => b.totalScore - a.totalScore);
    const reRanked = updatedStudents.map((s, idx) => ({ ...s, rank: idx + 1 }));

    if (data) {
      setData({ ...data, students: reRanked });
    }

    try {
      setUpdatingStudentId(student.id);
      await api.post(`/teacher/groups/${currentGroupId}/evaluation`, {
        studentId: student.id,
        score,
        date: selectedDate,
      });

      const label = score === 20 ? "Yashil (20 ball)" : score === 10 ? "Ko'k (10 ball)" : "Qizil (0 ball)";
      setSuccessToast(`${student.fullName}: ${label} belgilandi!`);
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error(err);
      // Revert if error
      fetchEvaluation(currentGroupId, selectedDate);
    } finally {
      setUpdatingStudentId(null);
    }
  };

  // Bulk rate all students (e.g. all 20 ball)
  const handleBulkEvaluate = async (score: 20 | 10 | 0) => {
    if (!currentGroupId) return;
    try {
      setIsLoading(true);
      await api.post(`/teacher/groups/${currentGroupId}/evaluation/batch`, {
        date: selectedDate,
        score,
      });
      setSuccessToast(`Barcha o'quvchilarga ${score} ball belgilandi!`);
      setTimeout(() => setSuccessToast(null), 3500);
      fetchEvaluation(currentGroupId, selectedDate);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // Delete this group
  const handleDeleteCurrentGroup = async () => {
    if (!data?.group?.name) return;
    if (!window.confirm(`Haqiqatan ham "${data.group.name}" guruhini o'chirmoqchimisiz?`)) {
      return;
    }
    try {
      await api.delete(`/teacher/groups/${currentGroupId}`);
      navigate('/teacher/groups');
    } catch (err: any) {
      alert(err.message || 'Guruhni o\'chirishda xatolik yuz berdi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="default"
            onClick={() => navigate('/teacher/groups')}
            icon={<ArrowLeft className="w-4 h-4" />}
            className="shadow-sm"
          >
            Orqaga
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                O'quvchilar Reytingi
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> Jonli Baholash
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {data?.group.name} • {data?.group.schedule}
            </p>
          </div>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="default"
            onClick={handleDeleteCurrentGroup}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="neu-button !text-rose-600 dark:!text-rose-400 font-bold border border-rose-500/30"
            title="Guruhni o'chirish"
          >
            O'chirish
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => handleBulkEvaluate(20)}
            icon={<Zap className="w-3.5 h-3.5 text-emerald-500" />}
            className="!text-emerald-600 dark:!text-emerald-400 font-bold border border-emerald-500/30"
            title="Barchaga 20 ball belgilash"
          >
            Barchaga Yashil (+20)
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => handleBulkEvaluate(10)}
            icon={<Zap className="w-3.5 h-3.5 text-sky-500" />}
            className="!text-sky-600 dark:!text-sky-400 font-bold border border-sky-500/30"
            title="Barchaga 10 ball belgilash"
          >
            Barchaga Ko'k (+10)
          </Button>
        </div>
      </div>

      {/* Group Selector & Date Picker Bar (Matching Image 1 & Image 2) */}
      <Card variant="raised-sm" className="p-4 border border-[var(--border-subtle)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          {/* Dropdown: GURUHNI TANLANG (Image 1 style) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 pl-1">
              GURUHNI TANLANG
            </label>
            <div className="relative">
              <Select
                value={currentGroupId}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="font-bold text-sm !py-3"
              >
                {allGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.students?.length || 0} o'quvchi)
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Date Picker: DARS SANASI (Soft UI custom datepicker) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 pl-1">
              DARS SANASI
            </label>
            <DatePicker
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Quick legend for grading */}
          <div className="p-2.5 rounded-xl neu-inset border border-[var(--border-subtle)] flex items-center justify-around text-xs font-bold">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> 20 ball
            </span>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> 10 ball
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> 0 ball
            </span>
          </div>
        </div>
      </Card>

      {/* Floating Success Toast */}
      {successToast && (
        <div className="p-3.5 rounded-2xl neu-inset bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-extrabold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Student Ranking & Evaluation Table (Matching Image 4) */}
      <Card variant="raised" className="p-0 overflow-hidden border border-[var(--border-subtle)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-black/[0.03] dark:bg-white/[0.03] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="py-4 px-4 w-16 text-center">O'RIN</th>
                <th className="py-4 px-5">O'QUVCHI</th>
                <th className="py-4 px-4 text-center">JAMI BALL</th>
                <th className="py-4 px-6 text-right">BAHOLASH (20 / 10 / 0)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 bg-[var(--shadow-dark)]/40 rounded w-6 mx-auto"></div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="h-4 bg-[var(--shadow-dark)]/40 rounded w-36"></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 bg-[var(--shadow-dark)]/40 rounded w-12 mx-auto"></div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-8 bg-[var(--shadow-dark)]/40 rounded w-44 ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : errorMessage ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-rose-600 dark:text-rose-400">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold">
                      <AlertCircle className="h-4 w-4" />
                      {errorMessage}
                    </span>
                  </td>
                </tr>
              ) : (data?.students || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[var(--text-muted)]">
                    <p className="text-sm font-semibold">Ushbu guruhda o'quvchilar mavjud emas</p>
                  </td>
                </tr>
              ) : (
                data?.students.map((student) => {
                  const isTop1 = student.rank === 1;
                  const isTop2 = student.rank === 2;
                  const isTop3 = student.rank === 3;

                  return (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-black/[0.015] dark:hover:bg-white/[0.015]"
                    >
                      {/* O'RIN */}
                      <td className="py-4 px-4 text-center">
                        {isTop1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/25 text-amber-600 dark:text-amber-300 font-black text-xs border border-amber-400/50">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/30 text-slate-700 dark:text-slate-200 font-black text-xs border border-slate-400/50">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-800 dark:text-amber-400 font-black text-xs border border-amber-700/50">
                            🥉 3
                          </span>
                        ) : (
                          <span className="font-bold text-xs text-[var(--text-muted)]">
                            {student.rank}
                          </span>
                        )}
                      </td>

                      {/* O'QUVCHI (Avatar, Full Name, STUDENT ID) */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center font-extrabold text-xs">
                            {student.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[var(--text-primary)]">
                              {student.fullName}
                            </p>
                            <p className="text-[11px] font-mono text-[var(--text-muted)] tracking-wider">
                              {student.studentCode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* JAMI BALL (Image 4 bold amber number) */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-black text-base text-amber-500 dark:text-amber-400 font-mono tracking-tight">
                          {student.totalScore}
                        </span>
                      </td>

                      {/* BAHOLASH (20 / 10 / 0 ball) - Requested by User */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* Yashil: 20 ball */}
                          <button
                            type="button"
                            onClick={() => handleEvaluateStudent(student, 20)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                              student.currentScore === 20
                                ? 'bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-400/50'
                                : 'neu-button text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
                            }`}
                            title="Yaxshi qatnashdi (20 ball)"
                          >
                            {student.currentScore === 20 && <Check className="w-3.5 h-3.5" />}
                            <span>+20</span>
                          </button>

                          {/* Ko'k: 10 ball */}
                          <button
                            type="button"
                            onClick={() => handleEvaluateStudent(student, 10)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                              student.currentScore === 10
                                ? 'bg-sky-600 text-white shadow-md scale-105 ring-2 ring-sky-400/50'
                                : 'neu-button text-sky-600 dark:text-sky-400 hover:bg-sky-500/15'
                            }`}
                            title="O'rtacha qatnashdi (10 ball)"
                          >
                            {student.currentScore === 10 && <Check className="w-3.5 h-3.5" />}
                            <span>+10</span>
                          </button>

                          {/* Qizil: 0 ball */}
                          <button
                            type="button"
                            onClick={() => handleEvaluateStudent(student, 0)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 ${
                              student.currentScore === 0
                                ? 'bg-rose-600 text-white shadow-md scale-105 ring-2 ring-rose-400/50'
                                : 'neu-button text-rose-600 dark:text-rose-400 hover:bg-rose-500/15'
                            }`}
                            title="Umuman yaxshi qatnashmadi (0 ball)"
                          >
                            {student.currentScore === 0 && <Check className="w-3.5 h-3.5" />}
                            <span>0</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
