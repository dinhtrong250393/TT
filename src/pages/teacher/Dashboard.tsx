import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FileText, Users, Clock, CheckCircle, XCircle, Play, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Exam {
  id: number;
  title: string;
  description: string;
  created_at: string;
  status: string;
  original_file_name: string;
}

export default function TeacherDashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishExam = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn phát hành đề thi này? Học sinh sẽ có thể làm bài ngay lập tức.')) return;
    
    try {
      const res = await fetch(`/api/exams/${id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchExams();
      }
    } catch (error) {
      console.error('Error publishing exam:', error);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Danh sách đề thi</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Quản lý các đề thi bạn đã tạo.</p>
        </div>
        <Link
          to="/teacher/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Tạo đề thi mới
        </Link>
      </div>
      <div className="border-t border-gray-200">
        {exams.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Chưa có đề thi nào. Hãy tạo mới!</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {exams.map((exam) => (
              <li key={exam.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600 truncate">{exam.title}</div>
                      <div className="text-sm text-gray-500">{exam.description || 'Không có mô tả'}</div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>
                          Tạo ngày: {format(new Date(exam.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                        <span className="mx-2">&bull;</span>
                        <p>File gốc: {exam.original_file_name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-end">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        exam.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exam.status === 'published' ? 'Đã phát hành' : 'Bản nháp'}
                      </span>
                    </div>
                    
                    {exam.status === 'draft' && (
                      <button
                        onClick={() => publishExam(exam.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Play className="mr-1 h-3 w-3" /> Phát hành
                      </button>
                    )}
                    
                    <Link
                      to={`/teacher/exam/${exam.id}/preview`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Eye className="mr-1 h-3 w-3 text-gray-500" /> Xem trước
                    </Link>

                    <Link
                      to={`/teacher/exam/${exam.id}/results`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Users className="mr-1 h-3 w-3 text-gray-500" /> Xem kết quả
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
