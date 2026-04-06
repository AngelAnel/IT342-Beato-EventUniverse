import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

export const getMe = () => {
  const token = localStorage.getItem('token');
  return API.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};