import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Layers, Users, Clock, GraduationCap, Eye } from 'lucide-react';
import { api } from '../../api/client';
import { Group, Teacher, Student } from '../../types';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';

export const AdminGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [viewingGroup, setViewingGroup] = useState<Group | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    teacherId: '',
    schedule: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [groupsData, teachersData] = await Promise.all([
        api.get<Group[]>('/admin/groups'),
        api.get<Teacher[]>('/admin/teachers'),
      ]);
      setGroups(groupsData);
      setTeachers(teachersData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      teacherId: teachers[0]?.id ? String(teachers[0].id) : '',
      schedule: 'Dush-Chor-Jum 14:00 - 16:00',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      teacherId: group.teacherId ? String(group.teacherId) : '',
      schedule: group.schedule,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.schedule.trim()) {
      setFormError('Guruh nomi va dars jadvalini kiriting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      const payload = {
        name: formData.name.trim(),
        teacherId: formData.teacherId ? Number(formData.teacherId) : null,
        schedule: formData.schedule.trim(),
      };

      if (editingGroup) {
        await api.put(`/admin/groups/${editingGroup.id}`, payload);
      } else {
        await api.post('/admin/groups', payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!groupToDelete) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/admin/groups/${groupToDelete.id}`);
      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Guruhni o\'chirishda xatolik.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Group>[] = [
    {
      header: 'Guruh nomi',
      accessor: (g) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl neu-raised flex items-center justify-center font-bold text-sm text-indigo-500">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-[var(--text-primary)]">{g.name}</p>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-indigo-400" /> {g.schedule}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Biriktirilgan o\'qituvchi',
      accessor: (g) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">
            {g.teacher?.user.fullName || 'Belgilanmagan'}
          </span>
        </div>
      ),
    },
    {
      header: 'O\'quvchilar soni',
      accessor: (g) => (
        <button
          onClick={() => {
            setViewingGroup(g);
            setIsStudentsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold neu-button text-[var(--text-primary)] hover:scale-105 transition-transform"
        >
          <Users className="w-3.5 h-3.5 text-indigo-500" />
          {g.students?.length || 0} nafar o'quvchi
          <Eye className="w-3 h-3 opacity-60 ml-1" />
        </button>
      ),
    },
    {
      header: 'Amallar',
      className: 'text-right',
      accessor: (g) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={() => openEditModal(g)}
            className="!p-2 text-indigo-500"
            title="Tahrirlash"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setGroupToDelete(g);
              setIsDeleteModalOpen(true);
            }}
            className="!p-2"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
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
          <h2 className="text-xl font-extrabold tracking-tight">Guruhlar ro'yxati</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            O'quv guruhlarini shakllantirish, o'qituvchi biriktirish va dars jadvallari
          </p>
        </div>
        <Button
          variant="primary"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
          className="shadow-[var(--shadow-raised)]"
        >
          Yangi guruh yaratish
        </Button>
      </div>

      {/* Groups Table */}
      <Table
        data={groups}
        columns={columns}
        keyExtractor={(g) => g.id}
        isLoading={isLoading}
        emptyMessage="Guruhlar topilmadi"
      />

      {/* Add / Edit Group Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? "Guruhni tahrirlash" : "Yangi guruh yaratish"}
        description="Guruh nomi, o'qituvchi va haftalik dars vaqtini belgilang"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl neu-inset bg-rose-500/10 text-rose-600 text-xs font-semibold">
              {formError}
            </div>
          )}

          <Input
            label="Guruh nomi"
            placeholder="Masalan: Frontend Bootcamp - React"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Select
            label="O'qituvchi"
            value={formData.teacherId}
            onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
          >
            <option value="">O'qituvchi tanlanmagan</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.fullName} ({t.subject})
              </option>
            ))}
          </Select>

          <Input
            label="Dars jadvali"
            placeholder="Masalan: Dush-Chor-Jum 14:00 - 16:00"
            value={formData.schedule}
            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
            required
          />

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
            >
              {editingGroup ? 'Saqlash' : 'Yaratish'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Group Students List Modal */}
      <Modal
        isOpen={isStudentsModalOpen}
        onClose={() => setIsStudentsModalOpen(false)}
        title={`${viewingGroup?.name || 'Guruh'} o'quvchilari`}
        description={`Jami ${viewingGroup?.students?.length || 0} nafar o'quvchi biriktirilgan`}
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {viewingGroup?.students && viewingGroup.students.length > 0 ? (
            <div className="space-y-2">
              {viewingGroup.students.map((student, idx) => (
                <div
                  key={student.id}
                  className="p-3.5 rounded-xl neu-inset flex items-center justify-between border border-[var(--border-subtle)]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[var(--text-muted)] w-5 text-center font-mono">
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-xl neu-raised flex items-center justify-center font-bold text-xs text-indigo-500">
                      {student.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{student.fullName}</p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">{student.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Ota-ona: {student.parentPhone}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-6">
              Ushbu guruhga hali o'quvchilar biriktirilmagan.
            </p>
          )}

          <div className="pt-3 border-t border-[var(--border-subtle)] flex justify-end">
            <Button variant="default" onClick={() => setIsStudentsModalOpen(false)}>
              Yopish
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Guruhni o'chirish"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Haqiqatan ham <strong className="text-[var(--text-primary)]">{groupToDelete?.name}</strong> guruhini o'chirmoqchimisiz? Guruhdagi o'quvchilar guruhsiz holatga o'tadi.
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
