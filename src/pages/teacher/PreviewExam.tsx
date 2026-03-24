import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, CheckCircle, Eye } from 'lucide-react';
import { renderHtmlWithLatex } from '../../lib/latex';

interface Question {
  id: string;
  html: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: { id: string; html: string; isCorrect?: boolean }[];
  correctAnswer?: string;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface Exam {
  id: number;
  title: string;
  description: string;
  content: {
    sections: Section[];
  };
}

export default function PreviewExam() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/exams/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setExam(data.exam);
      } else {
        setError(data.error || 'Lỗi tải đề thi');
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải đề thi...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!exam) return <div className="text-center py-10">Không tìm thấy đề thi</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/teacher" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-6 sticky top-0 z-10 border-b border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl leading-6 font-bold text-gray-900">{exam.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{exam.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-purple-600 font-medium bg-purple-50 px-3 py-1 rounded-full">
              <Eye className="mr-1.5 h-5 w-5" />
              <span>Chế độ xem trước (Giáo viên)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {exam.content.sections.map((section, sIdx) => (
          <div key={section.id} className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
            </div>
            <div className="p-6 space-y-8">
              {section.questions.map((q, qIdx) => (
                <div key={q.id} className="border border-gray-100 rounded-lg p-4 hover:border-blue-100 transition-colors">
                  <div 
                    className="prose max-w-none text-gray-900 mb-4"
                    dangerouslySetInnerHTML={{ __html: renderHtmlWithLatex(q.html) }}
                  />
                  
                  {(q.type === 'multiple_choice' || q.type === 'true_false') && q.options && (
                    <div className="space-y-2 mt-4">
                      {q.options.map((opt) => (
                        <div 
                          key={opt.id} 
                          className={`flex items-start p-3 rounded-md border transition-colors ${
                            opt.isCorrect ? 'bg-green-50 border-green-200' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              disabled
                              checked={opt.isCorrect}
                              className="h-4 w-4 text-green-600 border-gray-300 disabled:opacity-100"
                            />
                          </div>
                          <div className="ml-3 text-sm flex-1">
                            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: renderHtmlWithLatex(opt.html) }} />
                          </div>
                          {opt.isCorrect && (
                            <div className="ml-3 flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <span className="text-sm font-medium text-green-800">Đáp án đúng: </span>
                      <span className="text-sm text-green-900 font-bold">{q.correctAnswer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
