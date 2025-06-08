// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://13.68.97.186:4000",
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error);
    return Promise.reject(error);
  }
);

export default api;
