export type UserRole = 'ADMIN' | 'MANAGER' | 'TEACHER';

export interface User {
  id: number;
  fullName: string;
  login: string;
  role: UserRole;
  teacherId?: number;
  subject?: string;
}

export interface Student {
  id: number;
  fullName: string;
  phone: string;
  parentPhone: string;
  parentTelegramChatId?: string | null;
  birthDate: string;
  monthlyFee: number;
  groupId: number | null;
  group?: Group;
  createdAt: string;
}

export interface Teacher {
  id: number;
  userId: number;
  phone: string;
  subject: string;
  user: {
    id: number;
    fullName: string;
    login: string;
    role: string;
  };
  groups?: Group[];
}

export interface Group {
  id: number;
  name: string;
  teacherId: number | null;
  teacher?: Teacher;
  schedule: string;
  students?: Student[];
  _count?: {
    students: number;
  };
}

export type AttendanceStatus = 'KELDI' | 'KELMADI' | 'SABABLI';

export interface Attendance {
  id: number;
  studentId: number;
  student: Student;
  groupId: number;
  group: Group;
  date: string;
  status: AttendanceStatus;
  markedByTeacherId: number | null;
  markedByTeacher?: Teacher;
  reason: string | null;
  reasonByTeacherId: number | null;
  reasonByTeacher?: Teacher | null;
  reasonAt: string | null;
}

export interface Grade {
  id: number;
  studentId: number;
  student: Student;
  teacherId: number;
  teacher?: Teacher;
  score: number;
  comment?: string;
  date: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: number;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Payment {
  id: number;
  receiptNo: string;
  studentId: number;
  student: Student;
  month: string;
  date: string;
  amount: number;
  method: string;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export type GroupPaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'UNCONFIGURED';

export interface GroupPaymentSummary {
  id: number;
  name: string;
  teacher: {
    id: number;
    fullName: string;
    salaryMode: 'PERCENT' | 'FIXED' | null;
    salaryValue: number | null;
  } | null;
  studentCount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  unconfiguredCount: number;
  collectedAmount: number;
  expectedAmount: number;
  paymentPercentage: number;
  payroll: { id: number; amount: number } | null;
}

export interface GroupPaymentStudent {
  id: number;
  fullName: string;
  phone: string;
  monthlyFee: number;
  paidAmount: number;
  balance: number;
  status: GroupPaymentStatus;
  paymentPercentage: number;
  lastPaymentDate: string | null;
}

export interface GroupPaymentDetails {
  group: Pick<GroupPaymentSummary, 'id' | 'name' | 'teacher'>;
  month: string;
  summary: Omit<GroupPaymentSummary, 'id' | 'name' | 'teacher' | 'payroll' | 'studentCount'>;
  students: GroupPaymentStudent[];
  payroll: { id: number; amount: number } | null;
}

export interface DashboardStats {
  studentsCount: number;
  teachersCount: number;
  groupsCount: number;
  attendancePercentage: number;
  statusCounts: {
    keldi: number;
    kelmadi: number;
    sababli: number;
  };
  recentStudents: Student[];
  recentAttendances: Attendance[];
}

export interface ManagerOverview {
  totalStudents: number;
  totalTeachers: number;
  totalGroups: number;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface MonthlyChartItem {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export interface StudentRatingItem {
  rank: number;
  studentId: number;
  fullName: string;
  groupName: string;
  totalGradesCount: number;
  averageScore: number;
}

export interface EvaluatedStudent {
  id: number;
  fullName: string;
  phone: string;
  parentPhone: string;
  parentTelegramChatId?: string | null;
  birthDate: string;
  studentCode: string;
  totalScore: number;
  completedRatio: string;
  completedCount: number;
  pendingCount: number;
  greenCount: number;
  blueCount: number;
  redCount: number;
  currentScore: number | null;
  rank: number;
}

export interface GroupEvaluationResponse {
  group: {
    id: number;
    name: string;
    schedule: string;
    totalStudents: number;
  };
  date: string;
  students: EvaluatedStudent[];
}
