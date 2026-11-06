import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Modal } from './ui/Modal';

interface AccountCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CredentialsResponse {
  message: string;
  user: User;
}

export const AccountCredentialsModal: React.FC<AccountCredentialsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newLogin, setNewLogin] = useState(user?.login ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const normalizedLogin = newLogin.trim().toLowerCase();
    if (normalizedLogin === user.login && !newPassword.trim()) {
      setError('Yangi login yoki yangi parol kiriting.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await api.put<CredentialsResponse>('/auth/credentials', {
        currentPassword,
        newLogin: normalizedLogin,
        newPassword,
      });
      updateUser(result.user);
      setNewLogin(result.user.login);
      setSuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Hisob ma\'lumotlarini saqlashda xatolik yuz berdi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hisob ma'lumotlari"
      description="Login va parolni o'zgartirish uchun amaldagi parolni tasdiqlang."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Amaldagi parol"
          type={showCurrentPassword ? 'text' : 'password'}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowCurrentPassword((visible) => !visible)}
              className="inline-flex items-center justify-center rounded-md p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={showCurrentPassword ? 'Amaldagi parolni yashirish' : "Amaldagi parolni ko'rsatish"}
              aria-pressed={showCurrentPassword}
            >
              {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />
        <Input
          label="Yangi login"
          type="text"
          autoComplete="username"
          value={newLogin}
          onChange={(event) => setNewLogin(event.target.value)}
        />
        <Input
          label="Yangi parol (ixtiyoriy)"
          type={showNewPassword ? 'text' : 'password'}
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          rightElement={
            <button
              type="button"
              onClick={() => setShowNewPassword((visible) => !visible)}
              className="inline-flex items-center justify-center rounded-md p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={showNewPassword ? 'Yangi parolni yashirish' : "Yangi parolni ko'rsatish"}
              aria-pressed={showNewPassword}
            >
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />

        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
        {success && <p role="status" className="text-sm text-emerald-600">{success}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" onClick={handleClose} disabled={isSubmitting}>Bekor qilish</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
};
