export function generateKeywords(text) {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
}
