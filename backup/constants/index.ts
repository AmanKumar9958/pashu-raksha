const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "https://pashu-raksha.onrender.com/api";
const API_URL = rawApiUrl.startsWith("http") ? rawApiUrl : `http://${rawApiUrl}`;

export { API_URL };