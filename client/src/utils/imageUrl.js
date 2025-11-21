// Utility to convert relative image URLs to absolute URLs
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getImageUrl = (url) => {
  if (!url) return '';
  // If already absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If relative URL starting with /uploads, prepend API URL
  if (url.startsWith('/uploads/')) {
    return `${API_URL}${url}`;
  }
  // Otherwise return as is
  return url;
};

