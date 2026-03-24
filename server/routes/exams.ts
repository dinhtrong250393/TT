import express from 'express';
import multer from 'multer';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';
import { parseDocx } from '../services/parser';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get all exams (Teacher sees all, Student sees published)
router.get('/', authenticate, (req: AuthRequest, res) => {
  try {
    let exams;
    if (req.user?.role === 'teacher') {
      exams = db.prepare('SELECT id, title, description, created_at, status, original_file_name FROM exams ORDER BY created_at DESC').all();
    } else {
      exams = db.prepare('SELECT id, title, description, created_at FROM exams WHERE status = "published" ORDER BY created_at DESC').all();
    }
    res.json({ exams });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách đề thi' });
  }
});

// Upload and parse exam (Teacher only)
router.post('/upload', authenticate, requireRole('teacher'), upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    const { title, description } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'Vui lòng chọn file' });
    }

    if (!file.originalname.endsWith('.docx')) {
      return res.status(400).json({ error: 'Chỉ hỗ trợ file .docx hiện tại' });
    }

    // Parse the document
    const parsedExam = await parseDocx(file.buffer);

    // Save to database
    const stmt = db.prepare(`
      INSERT INTO exams (title, description, teacher_id, parsed_content, original_file_name, status)
      VALUES (?, ?, ?, ?, ?, 'draft')
    `);
    
    const result = stmt.run(
      title || 'Đề thi mới',
      description || '',
      req.user?.id,
      JSON.stringify(parsedExam),
      file.originalname
    );

    res.json({ 
      success: true, 
      examId: result.lastInsertRowid,
      message: 'Tải lên và phân tích thành công'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Lỗi xử lý file' });
  }
});

// Get specific exam details
router.get('/:id', authenticate, (req: AuthRequest, res) => {
  try {
    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id) as any;
    
    if (!exam) {
      return res.status(404).json({ error: 'Không tìm thấy đề thi' });
    }

    if (req.user?.role === 'student' && exam.status !== 'published') {
      return res.status(403).json({ error: 'Đề thi chưa được phát hành' });
    }

    const parsedContent = JSON.parse(exam.parsed_content || '{"sections":[]}');

    // If student, shuffle questions and remove correct answers
    if (req.user?.role === 'student') {
      // Simple shuffle function
      const shuffle = (array: any[]) => {
        const newArr = [...array];
        for (let i = newArr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
        }
        return newArr;
      };

      parsedContent.sections = parsedContent.sections.map((section: any) => {
        // Shuffle questions within section
        const shuffledQuestions = shuffle(section.questions).map((q: any) => {
          // Remove correct answers
          const safeQ = { ...q };
          delete safeQ.correctAnswer;
          if (safeQ.options) {
            safeQ.options = safeQ.options.map((opt: any) => {
              const safeOpt = { ...opt };
              delete safeOpt.isCorrect;
              return safeOpt;
            });
          }
          return safeQ;
        });
        return { ...section, questions: shuffledQuestions };
      });
    }

    res.json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        status: exam.status,
        content: parsedContent
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy thông tin đề thi' });
  }
});

// Publish exam
router.post('/:id/publish', authenticate, requireRole('teacher'), (req: AuthRequest, res) => {
  try {
    db.prepare('UPDATE exams SET status = "published" WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Đã phát hành đề thi' });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi phát hành đề thi' });
  }
});

// Submit exam (Student only)
router.post('/:id/submit', authenticate, requireRole('student'), (req: AuthRequest, res) => {
  try {
    const examId = req.params.id;
    const studentId = req.user?.id;
    const { answers } = req.body; // { 'q1': 'opt1_a', 'q4': '2' }

    // Get original exam to grade
    const exam = db.prepare('SELECT parsed_content FROM exams WHERE id = ?').get(examId) as any;
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const parsedContent = JSON.parse(exam.parsed_content);
    let totalQuestions = 0;
    let correctAnswers = 0;
    const wrongQuestions: string[] = [];

    // Grade the submission
    parsedContent.sections.forEach((section: any) => {
      section.questions.forEach((q: any) => {
        totalQuestions++;
        const studentAnswer = answers[q.id];
        let isCorrect = false;

        if (q.type === 'multiple_choice' || q.type === 'true_false') {
          const correctOpt = q.options?.find((o: any) => o.isCorrect);
          if (correctOpt && studentAnswer === correctOpt.id) {
            isCorrect = true;
          }
        } else if (q.type === 'short_answer') {
          if (studentAnswer && studentAnswer.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          correctAnswers++;
        } else {
          wrongQuestions.push(q.id);
        }
      });
    });

    const score = (correctAnswers / totalQuestions) * 10; // 10-point scale

    // Save submission
    const stmt = db.prepare(`
      INSERT INTO submissions (exam_id, student_id, score, total_questions, answers, wrong_questions)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      examId, 
      studentId, 
      score, 
      totalQuestions, 
      JSON.stringify(answers), 
      JSON.stringify(wrongQuestions)
    );

    res.json({
      success: true,
      score,
      wrongQuestions
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ error: 'Lỗi nộp bài' });
  }
});

// Get submissions for an exam (Teacher only)
router.get('/:id/submissions', authenticate, requireRole('teacher'), (req: AuthRequest, res) => {
  try {
    const submissions = db.prepare(`
      SELECT s.id, s.score, s.submitted_at, u.full_name, u.class, u.username
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.exam_id = ?
      ORDER BY s.score DESC
    `).all(req.params.id);
    
    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi lấy danh sách bài nộp' });
  }
});

export default router;
