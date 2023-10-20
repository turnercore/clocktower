// Sanitizes a string by replacing special characters with HTML entities
export const sanitizeString = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// // Usage Example
// const unsafeString = '<script>alert("XSS Attack!")</script>';
// const safeString = sanitizeString(unsafeString);
