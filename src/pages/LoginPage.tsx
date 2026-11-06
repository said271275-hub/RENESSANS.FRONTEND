import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, BookOpen, ArrowRight, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useSlowRequest } from '../hooks/useSlowRequest';
import { User as UserType } from '../types';

export const LoginPage: React.FC = () => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSlow = useSlowRequest(isLoading, 8_000);

  const { login, getRoleRedirectPath, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getRoleRedirectPath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, getRoleRedirectPath]);

  const executeLogin = async (u: string, p: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.post<{ token: string; user: UserType }>('/auth/login', {
        login: u.trim(),
        password: p.trim(),
      });

      login(res.token, res.user);
      const redirectPath = getRoleRedirectPath(res.user.role);
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login yoki parol noto\'g\'ri.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password.trim()) {
      setError('Iltimos, login va parolni kiriting.');
      return;
    }
    await executeLogin(loginInput, password);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[var(--bg-color)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Ambient background soft light glows for luxury Neumorphic depth */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-16 h-16 mx-auto rounded-3xl neu-raised flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shadow-[var(--shadow-raised)] border border-[var(--border-subtle)] transition-transform hover:scale-105 duration-300">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                RENESSANS
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-medium">
              O'quv markaz boshqaruv tizimi • Soft UI
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card variant="raised-lg" className="border border-[var(--border-subtle)] shadow-[var(--shadow-raised-lg)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold">Tizimga kirish</h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Xavfsiz tizim
              </span>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl neu-inset bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-shake">
                {error}
              </div>
            )}

            {isLoading && isSlow && (
              <div className="p-3.5 rounded-xl neu-inset bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-semibold text-center">
                ⏳ Server uyg'onmoqda, biroz kuting...
              </div>
            )}

            <Input
              type="text"
              placeholder="Loginni kiriting"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              autoComplete="username"
              required
            />

            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Parolni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-indigo-500" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 shadow-[var(--shadow-raised)] !bg-indigo-600 hover:!bg-indigo-700 font-bold"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Kirish
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
