import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE ?? 'http://10.0.2.2:3000', // emulador Android
  timeout: 15000,
});

// Mantener el token en memoria y en default headers
export function setBearerToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Manejo simple de 401 (opcional)
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      setBearerToken(null);
    }
    return Promise.reject(err);
  }
);

export default api;
