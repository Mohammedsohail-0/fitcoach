import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://fitcoach-xocd.onrender.com'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong. Please try again.';

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      toast.error('Your session has expired. Please log in again.');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?sessionExpired=true';
      }
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;