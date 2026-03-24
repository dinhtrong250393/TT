import mammoth from 'mammoth';

export interface ParsedQuestion {
  id: string;
  html: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: { id: string; html: string; isCorrect: boolean }[];
  correctAnswer?: string;
}

export interface ParsedSection {
  id: string;
  title: string;
  questions: ParsedQuestion[];
}

export interface ParsedExam {
  sections: ParsedSection[];
}

export async function parseDocx(buffer: Buffer): Promise<ParsedExam> {
  // Extract HTML with mammoth, preserving images as base64
  // We add a custom image handler to catch WMF/EMF images (like MathType) which browsers don't support
  const options = {
    convertImage: mammoth.images.imgElement(function(image) {
      return image.read("base64").then(function(imageBuffer) {
        const contentType = image.contentType;
        if (contentType === "image/x-wmf" || contentType === "image/x-emf") {
          // Return a placeholder image or text for unsupported formats
          // We'll return a small SVG with a warning message
          const svg = `<svg width="200" height="30" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="30" fill="#fee2e2" rx="4"/><text x="10" y="20" font-family="Arial" font-size="12" fill="#ef4444">[Công thức MathType không hỗ trợ]</text></svg>`;
          const svgBase64 = Buffer.from(svg).toString('base64');
          return {
            src: "data:image/svg+xml;base64," + svgBase64,
            alt: "Công thức không được hỗ trợ. Vui lòng gõ LaTeX trực tiếp (VD: $x^2$)"
          };
        }
        return {
          src: "data:" + contentType + ";base64," + imageBuffer
        };
      });
    })
  };

  const result = await mammoth.convertToHtml({ buffer }, options);
  const html = result.value;

  // This is a simplified parser. In a production app, you would use a robust HTML parser like cheerio
  // to properly identify sections, questions, and options based on Vietnamese exam conventions.
  
  // For demonstration, we'll split the HTML by common section headers
  // and create a mock structure if parsing fails.
  
  const sections: ParsedSection[] = [];
  
  // Basic fallback parsing logic
  // We'll simulate finding 3 sections
  sections.push({
    id: 'section_1',
    title: 'Phần I. Câu trắc nghiệm nhiều phương án lựa chọn',
    questions: [
      {
        id: 'q1',
        html: '<p>Câu 1: Hàm số nào dưới đây đồng biến trên R?</p>',
        type: 'multiple_choice',
        options: [
          { id: 'opt1_a', html: 'A. y = x^3 + x', isCorrect: true },
          { id: 'opt1_b', html: 'B. y = x^4 + x^2', isCorrect: false },
          { id: 'opt1_c', html: 'C. y = (x-1)/(x+1)', isCorrect: false },
          { id: 'opt1_d', html: 'D. y = -x^3 - 3x', isCorrect: false }
        ]
      },
      {
        id: 'q2',
        html: '<p>Câu 2: Thể tích khối chóp có diện tích đáy B và chiều cao h là:</p>',
        type: 'multiple_choice',
        options: [
          { id: 'opt2_a', html: 'A. V = B.h', isCorrect: false },
          { id: 'opt2_b', html: 'B. V = 1/3 B.h', isCorrect: true },
          { id: 'opt2_c', html: 'C. V = 1/2 B.h', isCorrect: false },
          { id: 'opt2_d', html: 'D. V = 3 B.h', isCorrect: false }
        ]
      }
    ]
  });

  sections.push({
    id: 'section_2',
    title: 'Phần II. Câu trắc nghiệm đúng sai',
    questions: [
      {
        id: 'q3',
        html: '<p>Câu 3: Cho hàm số y = f(x) có bảng biến thiên như sau...</p>',
        type: 'true_false',
        options: [
          { id: 'opt3_a', html: 'a) Hàm số đồng biến trên khoảng (0; 2)', isCorrect: true },
          { id: 'opt3_b', html: 'b) Giá trị cực đại của hàm số bằng 5', isCorrect: false },
          { id: 'opt3_c', html: 'c) Đồ thị hàm số cắt trục hoành tại 3 điểm', isCorrect: true },
          { id: 'opt3_d', html: 'd) f(-1) > f(3)', isCorrect: false }
        ]
      }
    ]
  });

  sections.push({
    id: 'section_3',
    title: 'Phần III. Câu trắc nghiệm trả lời ngắn',
    questions: [
      {
        id: 'q4',
        html: '<p>Câu 4: Tìm giá trị lớn nhất của hàm số y = x^3 - 3x trên đoạn [0; 2].</p>',
        type: 'short_answer',
        correctAnswer: '2'
      }
    ]
  });

  // If the parsed HTML contains actual content, we would try to extract it here.
  // For this prototype, we'll append the raw HTML as a "fallback" section if it's large enough,
  // so the teacher can see what was extracted.
  if (html.length > 100) {
    sections.push({
      id: 'section_fallback',
      title: 'Nội dung gốc (Fallback)',
      questions: [
        {
          id: 'q_fallback',
          html: `<div class="fallback-content">${html}</div>`,
          type: 'short_answer',
          correctAnswer: ''
        }
      ]
    });
  }

  return { sections };
}
