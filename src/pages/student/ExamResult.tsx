import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Award } from 'lucide-react';

export default function ExamResult() {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">Không tìm thấy kết quả.</p>
        <Link to="/student" className="text-blue-600 hover:underline">Quay lại trang chủ</Link>
      </div>
    );
  }

  const { score, wrongQuestions } = result;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <Award className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nộp bài thành công!</h2>
          <p className="text-gray-500 mb-8">Điểm số của bạn đã được ghi nhận hệ thống.</p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-8 inline-block min-w-[200px]">
            <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold mb-1">Điểm số</div>
            <div className={`text-5xl font-extrabold ${
              score >= 8 ? 'text-green-600' : 
              score >= 5 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {score.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500 mt-1">trên thang điểm 10</div>
          </div>

          <div className="text-left border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              Các câu trả lời sai ({wrongQuestions.length})
            </h3>
            
            {wrongQuestions.length > 0 ? (
              <div className="bg-red-50 rounded-md p-4 border border-red-100">
                <p className="text-sm text-red-700 mb-2">
                  Bạn đã trả lời sai các câu hỏi sau. 
                  <span className="font-semibold ml-1">Lưu ý: Đáp án đúng không được hiển thị để đảm bảo tính công bằng.</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {wrongQuestions.map((qId: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-white text-red-800 border border-red-200">
                      ID: {qId}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 rounded-md p-4 border border-green-100 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <p className="text-sm text-green-700 font-medium">Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi.</p>
              </div>
            )}
          </div>

          <div className="mt-8">
            <Link
              to="/student"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách đề thi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
