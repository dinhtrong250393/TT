# Hướng Dẫn Triển Khai Hệ Thống Thi Thử THPT Quốc Gia

Hệ thống này được xây dựng bằng React (Vite), Express, SQLite (cho môi trường dev) và Tailwind CSS. Để triển khai lên Vercel, chúng ta cần chuyển đổi backend sang serverless functions (Next.js API routes) hoặc sử dụng một database hỗ trợ serverless như Supabase/Neon/Prisma.

## 1. Kiến trúc dự án (Project Architecture)

- **Frontend**: React 18, Vite, Tailwind CSS, Zustand (State Management), React Router.
- **Backend (Dev)**: Express.js, Better-SQLite3, Multer (File Upload), Mammoth (DOCX Parsing).
- **Backend (Production/Vercel)**: Next.js API Routes (Serverless Functions), PostgreSQL (Neon/Supabase), Prisma ORM.
- **Authentication**: JWT (JSON Web Tokens), bcryptjs.
- **Tích hợp**: Google Sheets API (Account Sync).

## 2. Cấu trúc thư mục khuyến nghị (Recommended Folder Structure)

```
/
âââ src/
â   âââ components/     # UI components dùng chung (Layout, Button, Input)
â   âââ pages/          # Các trang chính (Login, TeacherDashboard, StudentDashboard)
â   âââ store/          # Zustand state management
â   âââ lib/            # Tiện ích (utils, api client)
â   âââ App.tsx         # Routing chính
âââ server/             # Backend (Express cho dev)
â   âââ routes/         # API endpoints
â   âââ services/       # Logic nghiệp vụ (Parser, Google Sheets)
â   âââ middleware/     # Auth middleware
â   âââ db.ts           # Database connection
âââ prisma/             # Schema cho Prisma (Production)
â   âââ schema.prisma
âââ .env.example        # Mẫu biến môi trường
âââ package.json
âââ vite.config.ts
```

## 3. Lược đồ cơ sở dữ liệu (Database Schema - Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          Int      @id @default(autoincrement())
  username    String   @unique
  password    String
  fullName    String
  role        String   // 'teacher' or 'student'
  class       String?
  status      String   @default("active")
  exams       Exam[]   @relation("TeacherExams")
  submissions Submission[]
}

model Exam {
  id               Int      @id @default(autoincrement())
  title            String
  description      String?
  teacherId        Int
  createdAt        DateTime @default(now())
  status           String   @default("draft") // 'draft', 'published'
  parsedContent    Json     // Cấu trúc JSON của đề thi
  originalFileName String?
  teacher          User     @relation("TeacherExams", fields: [teacherId], references: [id])
  submissions      Submission[]
}

model Submission {
  id             Int      @id @default(autoincrement())
  examId         Int
  studentId      Int
  submittedAt    DateTime @default(now())
  score          Float?
  totalQuestions Int
  answers        Json     // Câu trả lời của học sinh
  wrongQuestions Json     // Danh sách ID câu sai
  exam           Exam     @relation(fields: [examId], references: [id])
  student        User     @relation(fields: [studentId], references: [id])
}
```

## 4. Thiết kế tích hợp Google Sheets

Để quản lý tài khoản qua Google Sheets mà không cần sửa code:

1. **Tạo Google Service Account**: Lấy file JSON credentials.
2. **Chia sẻ Google Sheet**: Cấp quyền đọc cho email của Service Account.
3. **Cấu trúc Sheet**:
   - Cột A: `username`
   - Cột B: `password` (Mật khẩu gốc, hệ thống sẽ tự hash khi sync)
   - Cột C: `fullName`
   - Cột D: `role` (`teacher` hoặc `student`)
   - Cột E: `class` (Lớp, ví dụ: 12A1)
   - Cột F: `status` (`active` hoặc `inactive`)
4. **Đồng bộ**: API `/api/auth/sync` sẽ đọc dữ liệu từ Sheet (dùng thư viện `googleapis`), hash mật khẩu mới và cập nhật vào Database.

## 5. Luồng xác thực (Authentication Flow)

1. Người dùng nhập username/password.
2. Backend kiểm tra trong Database, so sánh hash bằng `bcrypt`.
3. Nếu đúng, tạo JWT token chứa `id`, `role`, `username`.
4. Frontend lưu token vào `localStorage` và Zustand store.
5. Các request tiếp theo gửi token trong header `Authorization: Bearer <token>`.
6. Middleware `authenticate` và `requireRole` kiểm tra quyền truy cập API.

## 6. Quy trình phân tích Word/PDF (Parsing Workflow)

1. **Upload**: Giáo viên tải file `.docx` lên.
2. **Extract**: Sử dụng `mammoth` để trích xuất HTML từ file Word. Hình ảnh được chuyển thành base64 nhúng trực tiếp vào HTML.
3. **Parse**: Phân tích HTML để tìm các thẻ tiêu đề (Phần I, Phần II) và câu hỏi (Câu 1, Câu 2).
4. **Fallback Strategy**:
   - Nếu cấu trúc file quá phức tạp hoặc không chuẩn, hệ thống sẽ lưu toàn bộ HTML vào một "Section Fallback".
   - Công thức toán học (MathType/Equation) nếu được lưu dưới dạng ảnh trong Word sẽ được giữ nguyên.
   - Bảng biểu được `mammoth` chuyển thành thẻ `<table>` HTML tiêu chuẩn.
5. **Lưu trữ**: Lưu cấu trúc JSON đã phân tích vào cột `parsedContent` của bảng `Exam`.

## 7. Xử lý điểm và nộp bài bảo mật

- **Không gửi đáp án về Frontend**: API `GET /api/exams/:id` cho học sinh sẽ tự động xóa trường `correctAnswer` và `isCorrect` trước khi trả về.
- **Chấm điểm trên Server**: Khi học sinh nộp bài, chỉ gửi danh sách lựa chọn (ví dụ: `{ "q1": "opt_a" }`). Server sẽ lấy đề gốc từ DB, đối chiếu và tính điểm.
- **Kết quả**: Trả về điểm số và danh sách ID câu sai. Học sinh không biết đáp án đúng là gì.

## 8. Hướng dẫn triển khai Vercel (Vercel Deployment Guide)

Do Vercel là môi trường Serverless, bạn cần chuyển đổi backend Express sang Next.js hoặc sử dụng Vercel Functions.

**Bước 1: Chuẩn bị Database**
- Tạo tài khoản Neon (Serverless Postgres) hoặc Supabase.
- Lấy chuỗi kết nối (Database URL).

**Bước 2: Cấu hình biến môi trường trên Vercel**
- `DATABASE_URL`: Chuỗi kết nối Postgres.
- `JWT_SECRET`: Chuỗi bí mật ngẫu nhiên.
- `GOOGLE_SHEETS_CLIENT_EMAIL`: Email service account.
- `GOOGLE_SHEETS_PRIVATE_KEY`: Private key.
- `GOOGLE_SHEET_ID`: ID của bảng tính.

**Bước 3: Triển khai**
1. Đẩy code lên GitHub.
2. Đăng nhập Vercel, chọn "Add New Project".
3. Chọn repository từ GitHub.
4. Cấu hình Build Command (nếu dùng Vite): `npm run build`.
5. Cấu hình Output Directory: `dist`.
6. Nhập các biến môi trường ở Bước 2.
7. Nhấn "Deploy".

## 9. Chiến lược dự phòng (Fallback Strategy) cho Công thức, Bảng và Hình ảnh

- **Công thức (Formulas)**: Khuyến khích giáo viên sử dụng MathType và xuất ra ảnh, hoặc sử dụng tính năng Equation của Word mới (được hỗ trợ tốt hơn). Nếu dùng LaTeX, có thể tích hợp KaTeX trên frontend để render chuỗi text thành công thức.
- **Bảng (Tables)**: Thư viện `mammoth` hỗ trợ chuyển đổi bảng Word sang HTML `<table>` rất tốt. Chỉ cần thêm CSS Tailwind (ví dụ: `prose table-auto border-collapse`) để bảng hiển thị đẹp trên web.
- **Hình ảnh (Images)**: `mammoth` tự động chuyển ảnh thành chuỗi base64. Điều này đảm bảo ảnh luôn đi kèm với câu hỏi mà không cần hệ thống lưu trữ file riêng biệt (S3/Cloudinary), rất phù hợp cho đề thi.
- **Cấu trúc không chuẩn**: Nếu không nhận diện được "Phần" hay "Câu", toàn bộ nội dung sẽ được hiển thị như một bài đọc lớn, giáo viên có thể xem trước và quyết định có cần sửa lại file Word cho chuẩn hay không.
