import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import TeacherDashboard from './pages/teacher/Dashboard';
import CreateExam from './pages/teacher/CreateExam';
import ExamResults from './pages/teacher/ExamResults';
import PreviewExam from './pages/teacher/PreviewExam';
import StudentDashboard from './pages/student/Dashboard';
import TakeExam from './pages/student/TakeExam';
import ExamResult from './pages/student/ExamResult';
import Layout from './components/Layout';
import 'katex/dist/katex.min.css';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { checkAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
        
        <Route path="/" element={
          isAuthenticated ? (
            user?.role === 'teacher' ? <Navigate to="/teacher" replace /> : <Navigate to="/student" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />

        {/* Teacher Routes */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<TeacherDashboard />} />
          <Route path="create" element={<CreateExam />} />
          <Route path="exam/:id/results" element={<ExamResults />} />
          <Route path="exam/:id/preview" element={<PreviewExam />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="exam/:id" element={<TakeExam />} />
          <Route path="exam/:id/result" element={<ExamResult />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
