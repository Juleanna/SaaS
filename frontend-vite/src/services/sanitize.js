import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'a', 'b', 'i', 'em', 'strong', 'u', 's', 'p', 'br', 'hr',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
];

const ALLOWED_ATTR = ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'style'];

export const sanitizeHtml = (html) => {
  if (!html) return '';
  return DOMPurify.sanitize(String(html), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
};

export default sanitizeHtml;
