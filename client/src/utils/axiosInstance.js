import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://status-page-a.vercel.app/api',
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set the token with the expected header name
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
