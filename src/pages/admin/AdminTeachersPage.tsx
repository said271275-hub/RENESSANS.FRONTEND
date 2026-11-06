import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Phone,
  BookOpen,
  Key,
  Sparkles,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../api/client';
import { Teacher } from '../../types';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

export const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Dedicated Credentials Modal (Login & Parol)
  const [isCredsModalOpen, setIsCredsModalOpen] = useState(false);
  const [selectedTeacherForCreds, setSelectedTeacherForCreds] = useState<Teacher | null>(null);
  const [credsLogin, setCredsLogin] = useState('');
  const [credsPassword, setCredsPassword] = useState('');
  const [showCredsPassword, setShowCredsPassword] = useState(false);
  const [credsSuccessData, setCredsSuccessData] = useState<{
    fullName: string;
    login: string;
    password: string;
  } | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    subject: '',
    login: '',
    password: '',
  });
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Teacher[]>('/admin/teachers');
      setTeachers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const openCreateModal = () => {
    setEditingTeacher(null);
    setFormData({
      fullName: '',
      phone: '+998 ',
      subject: '',
      login: '',
      password: '',
    });
    setShowFormPassword(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: teacher.user.fullName,
      phone: teacher.phone,
      subject: teacher.subject,
      login: teacher.user.login,
      password: '',
    });
    setShowFormPassword(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open dedicated Login & Password Modal
  const openCredsModal = (teacher: Teacher) => {
    setSelectedTeacherForCreds(teacher);
    setCredsLogin(teacher.user.login);
    setCredsPassword('');
    setShowCredsPassword(false);
    setCredsSuccessData(null);
    setCopiedSuccess(false);
    setFormError(null);
    setIsCredsModalOpen(true);
  };

  // Generate a random clean password
  const generateRandomPassword = () => {
    const words = ['renessans', 'ustoz', 'teacher'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `${randomWord}${randomNum}`;
  };

  const handleCredsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherForCreds) return;
    if (!credsLogin.trim()) {
      setFormError('Login kiritilishi shart.');
      return;
    }
    if (!credsPassword.trim()) {
      setFormError('Yangi parol kiritilishi shart.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await api.post(`/admin/teachers/${selectedTeacherForCreds.id}/credentials`, {
        login: credsLogin.trim().toLowerCase(),
        password: credsPassword.trim(),
      });

      setCredsSuccessData({
        fullName: selectedTeacherForCreds.user.fullName,
        login: credsLogin.trim().toLowerCase(),
        password: credsPassword.trim(),
      });
      fetchTeachers();
    } catch (err: any) {
      setFormError(err.message || 'Login/parolni o\'zgartirishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCredsToClipboard = () => {
    if (!credsSuccessData) return;
    const text = `Hurmatli ${credsSuccessData.fullName}!\nSizning RENESSANS tizimidagi hisob ma'lumotlaringiz:\n🔑 Login: ${credsSuccessData.login}\n🔒 Parol: ${credsSuccessData.password}\n🌐 Kirish manzili: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.subject.trim()) {
      setFormError('Iltimos, ism, telefon va fanni to\'ldiring.');
      return;
    }

    if (!editingTeacher && (!formData.login.trim() || !formData.password.trim())) {
      setFormError('Yangi o\'qituvchi uchun login va parol kiritilishi shart.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      if (editingTeacher) {
        await api.put(`/admin/teachers/${editingTeacher.id}`, {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject.trim(),
          login: formData.login.trim().toLowerCase(),
          password: formData.password ? formData.password.trim() : undefined,
        });
      } else {
        await api.post('/admin/teachers', {
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          subject: formData.subject.trim(),
          login: formData.login.trim().toLowerCase(),
          password: formData.password.trim(),
        });
      }

      setIsModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/admin/teachers/${teacherToDelete.id}`);
      setIsDeleteModalOpen(false);
      setTeacherToDelete(null);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'O\'qituvchini o\'chirishda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      t.user.fullName.toLowerCase().includes(q) ||
      t.user.login.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.phone.includes(q)
    );
  });

  const columns: Column<Teacher>[] = [
    {
      header: 'O\'qituvchi',
      accessor: (t) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center font-extrabold text-sm text-red-500 bg-red-500/10 border border-red-500/20">
            {t.user.fullName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">{t.user.fullName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <Key className="w-2.5 h-2.5" /> {t.user.login}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Fani',
      accessor: (t) => (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)] text-[var(--text-primary)]">
          <BookOpen className="w-3.5 h-3.5 text-red-500" />
          {t.subject}
        </span>
      ),
    },
    {
      header: 'Telefon',
      accessor: (t) => (
        <span className="text-xs font-mono flex items-center gap-1 text-[var(--text-secondary)] font-medium">
          <Phone className="w-3 h-3 opacity-60" /> {t.phone}
        </span>
      ),
    },
    {
      header: 'Biriktirilgan guruhlar',
      accessor: (t) => (
        <span className="text-xs font-bold text-[var(--text-primary)] px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--border-subtle)]">
          {t.groups?.length || 0} ta guruh
        </span>
      ),
    },
    {
      header: 'Amallar',
      className: 'text-right',
      accessor: (t) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Quick Login & Password Reset Button */}
          <Button
            size="sm"
            variant="default"
            onClick={() => openCredsModal(t)}
            className="!py-1.5 !px-2.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
            title="Login va Parol sozlash"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Login/Parol</span>
          </Button>

          {/* Edit Button */}
          <Button
            size="sm"
            variant="default"
            onClick={() => openEditModal(t)}
            className="!p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Ma'lumotlarni tahrirlash"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>

          {/* Delete Button */}
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setTeacherToDelete(t);
              setIsDeleteModalOpen(true);
            }}
            className="!p-2 text-rose-500 hover:text-rose-600"
            title="O'chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
              O'qituvchilar
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-500/10 text-red-500 border border-red-500/20">
              Admin boshqaruvi
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            O'qituvchilar hisoblarini yaratish, login va parollarni belgilash
          </p>
        </div>

        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
          className="!bg-red-600 hover:!bg-red-700 !text-white font-bold shadow-lg"
        >
          Yangi o'qituvchi qo'shish
        </Button>
      </div>

      {/* Search and Counts Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Ism, login, fan yoki telefon bo'yicha qidiring..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="neu-input !py-2.5 !px-4 text-xs sm:text-sm border border-[var(--border-subtle)] rounded-2xl"
          />
        </div>
        <div className="text-xs text-[var(--text-secondary)] font-semibold pl-1">
          Jami: <span className="font-extrabold text-[var(--text-primary)]">{filteredTeachers.length}</span> nafar o'qituvchi
        </div>
      </div>

      {/* Teachers Table */}
      <Table
        data={filteredTeachers}
        columns={columns}
        keyExtractor={(t) => t.id}
        isLoading={isLoading}
        emptyMessage="O'qituvchilar topilmadi"
      />

      {/* ================= DEDICATED LOGIN & PAROL MODAL ================= */}
      <Modal
        isOpen={isCredsModalOpen}
        onClose={() => setIsCredsModalOpen(false)}
        title="O'qituvchiga Login va Parol berish"
        description={`${selectedTeacherForCreds?.user.fullName} uchun tizimga kirish ma'lumotlarini belgilang`}
      >
        {credsSuccessData ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Login va parol muvaffaqiyatli saqlandi!</span>
              </div>
              <p className="text-xs opacity-90">
                O'qituvchi endi ushbu ma'lumotlar bilan to'g'ridan-to'g'ri tizimga kira oladi:
              </p>
            </div>

            <div className="p-4 rounded-2xl neu-inset border border-[var(--border-subtle)] space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">O'qituvchi:</span>
                <span className="font-bold text-[var(--text-primary)]">{credsSuccessData.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Login:</span>
                <span className="font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {credsSuccessData.login}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Parol:</span>
                <span className="font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {credsSuccessData.password}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">Kirish manzili:</span>
                <span className="text-[var(--text-secondary)]">http://localhost:3000/login</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={copyCredsToClipboard}
                className="flex-1 !bg-indigo-600 hover:!bg-indigo-700 !text-white font-bold flex items-center justify-center gap-2"
              >
                {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedSuccess ? "Nusxalandi!" : "Ma'lumotlardan nusxa olish (Telegram/SMS)"}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => setIsCredsModalOpen(false)}
              >
                Yopish
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCredsSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl neu-inset bg-rose-500/10 text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-500 font-medium">
              💡 Siz o'rnatgan login va parol darhol kuchga kiradi va o'qituvchi shu login-parol bilan tizimga kiradi.
            </div>

            <div>
              <Input
                label="Login (Foydalanuvchi nomi)"
                placeholder="Masalan: erali, sardor, ustoz_ali"
                value={credsLogin}
                onChange={(e) => setCredsLogin(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                required
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1 pl-1">
                Kichik harflar va bo'shliqsiz yoziladi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 pl-1">
                Yangi parol
              </label>
              <div className="relative">
                <input
                  type={showCredsPassword ? 'text' : 'password'}
                  placeholder="Yangi parolni kiriting (masalan: teacher123)"
                  value={credsPassword}
                  onChange={(e) => setCredsPassword(e.target.value)}
                  className="w-full neu-input text-xs sm:text-sm pl-4 pr-24 py-2.5 rounded-2xl border border-[var(--border-subtle)]"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCredsPassword(!showCredsPassword)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
                    title={showCredsPassword ? "Yashirish" : "Ko'rsatish"}
                  >
                    {showCredsPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generateRandomPassword();
                      setCredsPassword(p);
                      setShowCredsPassword(true);
                    }}
                    className="p-1.5 text-xs text-indigo-500 hover:text-indigo-600 rounded-lg flex items-center gap-1"
                    title="Tasodifiy parol generatsiya qilish"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
              <Button
                type="button"
                variant="default"
                onClick={() => setIsCredsModalOpen(false)}
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="!bg-indigo-600 hover:!bg-indigo-700 !text-white font-bold"
              >
                Saqlash va ma'lumotlarni olish
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ================= ADD / EDIT TEACHER MODAL ================= */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
        description="O'qituvchi ma'lumotlari va tizimga kirish login/parolini belgilang"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl neu-inset bg-rose-500/10 text-rose-600 text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Ism va Familiya"
            placeholder="Masalan: Sardor Rahimov"
            value={formData.fullName}
            onChange={(e) => {
              const val = e.target.value;
              setFormData((prev) => ({
                ...prev,
                fullName: val,
                // If creating and login is empty or auto-matching, suggest login
                login: !editingTeacher && (!prev.login || prev.login === prev.fullName.trim().split(' ')[0].toLowerCase())
                  ? val.trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
                  : prev.login,
              }));
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefon raqami"
              placeholder="+998 90 123 45 67"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Mutaxassislik / Fan"
              placeholder="Masalan: Matematika yoki Ingliz tili"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Login (Tizimga kirish uchun)"
                placeholder="Masalan: sardor"
                value={formData.login}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    login: e.target.value.toLowerCase().replace(/\s+/g, ''),
                  })
                }
                required
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1 pl-1">
                Kichik harflar bilan yozing
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 pl-1">
                {editingTeacher ? "Yangi parol (ixtiyoriy)" : "Parol (majburiy)"}
              </label>
              <div className="relative">
                <input
                  type={showFormPassword ? 'text' : 'password'}
                  placeholder={editingTeacher ? "O'zgartirmaslik uchun bo'sh qoldiring" : "Masalan: teacher123"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full neu-input text-xs sm:text-sm pl-4 pr-20 py-2.5 rounded-2xl border border-[var(--border-subtle)]"
                  required={!editingTeacher}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg"
                  >
                    {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generateRandomPassword();
                      setFormData((prev) => ({ ...prev, password: p }));
                      setShowFormPassword(true);
                    }}
                    className="p-1 text-xs text-indigo-500 rounded"
                    title="Generatsiya"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

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
              className="!bg-red-600 hover:!bg-red-700 !text-white font-bold"
            >
              {editingTeacher ? 'Saqlash' : 'O\'qituvchini qo\'shish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="O'qituvchini o'chirish"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Haqiqatan ham <strong className="text-[var(--text-primary)]">{teacherToDelete?.user.fullName}</strong> ustozni o'chirmoqchimisiz? Ushbu amal qaytarilmaydi.
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
      </Modal>
    </div>
  );
};
