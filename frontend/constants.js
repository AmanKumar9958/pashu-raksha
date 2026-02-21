const IP_ADDRESS = "10.181.238.106";

// For physical devices, hardcoding an IP often breaks when your PC IP changes.
// Prefer setting EXPO_PUBLIC_API_URL in `frontend/.env`, e.g.:
// EXPO_PUBLIC_API_URL=http://192.168.1.10:5000/api
export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${IP_ADDRESS}:5000/api`