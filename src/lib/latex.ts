import katex from 'katex';

const unescapeHtml = (safe: string) => {
  return safe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

export const renderHtmlWithLatex = (htmlString: string) => {
  if (!htmlString) return '';

  let rendered = htmlString;

  // Render block math: $$ ... $$
  rendered = rendered.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(unescapeHtml(math), { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // Render block math: \[ ... \]
  rendered = rendered.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
    try {
      return katex.renderToString(unescapeHtml(math), { displayMode: true, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // Render inline math: \( ... \)
  rendered = rendered.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
    try {
      return katex.renderToString(unescapeHtml(math), { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  // Render inline math: $ ... $
  // We use a negative lookbehind/lookahead or just a non-greedy match to avoid matching across valid text
  // The regex \$((?:[^$]|\\[$])*?)\$ matches everything between $...$ unless it contains an unescaped $
  rendered = rendered.replace(/\$((?:[^$]|\\[$])*?)\$/g, (match, math) => {
    try {
      // If it's just a dollar sign used for currency, katex might fail or render weirdly,
      // but throwOnError: false will fallback to the original string if it's completely invalid.
      // However, it's usually fine for math exams.
      return katex.renderToString(unescapeHtml(math), { displayMode: false, throwOnError: false });
    } catch (e) {
      return match;
    }
  });

  return rendered;
};
