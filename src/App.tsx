import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { Loader2 } from 'lucide-react';
import { Card } from './components/ui/Card';
import { useSlowRequest } from './hooks/useSlowRequest';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminTeachersPage } from './pages/admin/AdminTeachersPage';
import { AdminGroupsPage } from './pages/admin/AdminGroupsPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';

// Manager Pages
import { ManagerOverviewPage } from './pages/manager/ManagerOverviewPage';
import { ManagerFinancePage } from './pages/manager/ManagerFinancePage';
import { ManagerRatingPage } from './pages/manager/ManagerRatingPage';
import { ManagerPaymentsPage } from './pages/manager/ManagerPaymentsPage';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { TeacherGroupsPage } from './pages/teacher/TeacherGroupsPage';
import { TeacherGroupDetailPage } from './pages/teacher/TeacherGroupDetailPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';

// Root Redirect Helper
const RootRedirect: React.FC = () => {
  const { isAuthenticated, user, getRoleRedirectPath, isLoading } = useAuth();
  const isSlow = useSlowRequest(isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <Card variant="raised" className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Yuklanmoqda...</p>
          {isSlow && (
            <p className="text-xs text-amber-500 font-medium text-center max-w-[200px]">
              ⏳ Server uyg'onmoqda, biroz kuting...
            </p>
          )}
        </Card>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

// 404 Page
const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[var(--bg-color)] text-[var(--text-primary)]">
      <div className="p-8 rounded-3xl neu-raised text-center max-w-md border border-[var(--border-subtle)] space-y-4">
        <h1 className="text-6xl font-black text-[var(--accent)]">404</h1>
        <h2 className="text-xl font-bold">Sahifa topilmadi</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Siz qidirayotgan manzil mavjud emas yoki o'chirilgan bo'lishi mumkin.
        </p>
        <div className="pt-2">
          <a
            href="/"
            className="neu-button neu-button-primary inline-flex text-sm px-6 py-2.5"
          >
            Bosh sahifaga qaytish
          </a>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<RootRedirect />} />

            {/* ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<DashboardLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="payments" element={<AdminPaymentsPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="teachers" element={<AdminTeachersPage />} />
                <Route path="groups" element={<AdminGroupsPage />} />
                <Route path="attendance" element={<AdminAttendancePage />} />
              </Route>
            </Route>

            {/* MANAGER ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['MANAGER']} />}>
              <Route path="/manager" element={<DashboardLayout />}>
                <Route index element={<ManagerOverviewPage />} />
                <Route path="finance" element={<ManagerFinancePage />} />
                <Route path="payments" element={<ManagerPaymentsPage />} />
                <Route path="ratings" element={<ManagerRatingPage />} />
              </Route>
            </Route>

            {/* TEACHER ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['TEACHER']} />}>
              <Route path="/teacher" element={<DashboardLayout />}>
                <Route index element={<TeacherDashboardPage />} />
                <Route path="groups" element={<TeacherGroupsPage />} />
                <Route path="groups/:groupId" element={<TeacherGroupDetailPage />} />
                <Route path="attendance" element={<TeacherAttendancePage />} />
                <Route path="grading" element={<Navigate to="/teacher/groups" replace />} />
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
