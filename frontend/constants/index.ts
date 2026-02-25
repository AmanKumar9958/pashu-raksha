const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "http://10.181.238.106:5000/api";
const API_URL = rawApiUrl.startsWith("http") ? rawApiUrl : `http://${rawApiUrl}`;

export { API_URL };