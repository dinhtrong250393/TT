import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UploadCloud, FileText, AlertCircle } from 'lucide-react';

export default function CreateExam() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.docx')) {
        setError('Vui lòng chọn file .docx');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Vui lòng chọn file đề thi');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    try {
      const res = await fetch('/api/exams/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error("Lỗi máy chủ: Máy chủ đang khởi động lại hoặc không phản hồi đúng định dạng.");
      }

      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tải lên đề thi');
      }

      // Navigate back to dashboard on success
      navigate('/teacher');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tạo đề thi mới</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Tải lên file Word (.docx) chứa nội dung đề thi. Hệ thống sẽ tự động phân tích và tạo đề thi trực tuyến.</p>
          </div>
          
          <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Tên đề thi
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                  placeholder="Ví dụ: Đề thi thử THPT Quốc gia môn Toán 2026"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Mô tả (Tùy chọn)
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md py-2 px-3"
                  placeholder="Ghi chú thêm về đề thi..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">File đề thi (.docx)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Tải file lên</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".docx" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">hoặc kéo thả vào đây</p>
                  </div>
                  <p className="text-xs text-gray-500">Chỉ hỗ trợ DOCX lên đến 10MB</p>
                </div>
              </div>
              {file && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">{file.name}</span>
                  <span className="ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/teacher')}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Tải lên và Phân tích'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800">Hướng dẫn định dạng file Word:</h4>
        <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
          <li>Sử dụng cấu trúc chuẩn: Phần I, Phần II, Phần III.</li>
          <li>Câu hỏi trắc nghiệm đánh dấu A, B, C, D rõ ràng.</li>
          <li>Đánh dấu đáp án đúng bằng cách in đậm hoặc gạch chân (tùy thuộc vào quy ước).</li>
          <li>Công thức toán học nên dùng MathType hoặc Equation Editor chuẩn.</li>
        </ul>
      </div>
    </div>
  );
}
