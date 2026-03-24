import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FileText, Clock, PlayCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Exam {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function StudentDashboard() {
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

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Đề thi hiện có</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Chọn đề thi để bắt đầu làm bài.</p>
      </div>
      <div className="border-t border-gray-200">
        {exams.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Hiện tại chưa có đề thi nào được phát hành.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {exams.map((exam) => (
              <li key={exam.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 truncate">{exam.title}</div>
                      <div className="text-sm text-gray-500">{exam.description || 'Không có mô tả'}</div>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>
                          Ngày đăng: {format(new Date(exam.created_at), 'dd/MM/yyyy', { locale: vi })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <Link
                      to={`/student/exam/${exam.id}`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu làm bài
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
