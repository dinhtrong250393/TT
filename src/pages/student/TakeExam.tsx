import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { renderHtmlWithLatex } from '../../lib/latex';

interface Question {
  id: string;
  html: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: { id: string; html: string }[];
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface Exam {
  id: number;
  title: string;
  content: {
    sections: Section[];
  };
}

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn nộp bài?')) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ answers })
      });
      
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        throw new Error("Lỗi máy chủ: Máy chủ đang khởi động lại hoặc không phản hồi đúng định dạng.");
      }
      
      if (res.ok) {
        // Navigate to results page, passing the result data via state
        navigate(`/student/exam/${id}/result`, { state: { result: data } });
      } else {
        setError(data.error || 'Lỗi nộp bài');
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setError(error.message || 'Lỗi kết nối khi nộp bài');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải đề thi...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!exam) return <div className="text-center py-10">Không tìm thấy đề thi</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="bg-white shadow sm:rounded-lg mb-6 sticky top-0 z-10 border-b border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl leading-6 font-bold text-gray-900">{exam.title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Hãy đọc kỹ câu hỏi và chọn đáp án đúng nhất.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
              <Clock className="mr-1.5 h-5 w-5" />
              <span>Đang làm bài</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </button>
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
                  
                  {q.type === 'multiple_choice' && q.options && (
                    <div className="space-y-2 mt-4">
                      {q.options.map((opt) => (
                        <label 
                          key={opt.id} 
                          className={`flex items-start p-3 rounded-md border cursor-pointer transition-colors ${
                            answers[q.id] === opt.id ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              value={opt.id}
                              checked={answers[q.id] === opt.id}
                              onChange={() => handleAnswerChange(q.id, opt.id)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: renderHtmlWithLatex(opt.html) }} />
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'true_false' && q.options && (
                    <div className="space-y-2 mt-4">
                      {q.options.map((opt) => (
                        <label 
                          key={opt.id} 
                          className={`flex items-start p-3 rounded-md border cursor-pointer transition-colors ${
                            answers[q.id] === opt.id ? 'bg-blue-50 border-blue-200' : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              value={opt.id}
                              checked={answers[q.id] === opt.id}
                              onChange={() => handleAnswerChange(q.id, opt.id)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: renderHtmlWithLatex(opt.html) }} />
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'short_answer' && (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                      />
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
