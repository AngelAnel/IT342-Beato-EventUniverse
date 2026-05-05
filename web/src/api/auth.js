import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);

export const updateProfile = (data, token) =>
  axios.put('http://localhost:8080/api/v1/auth/profile', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMe = () => {
  const token = localStorage.getItem('token');
  return API.get('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const changePassword = (data, token) =>
  axios.put('http://localhost:8080/api/v1/auth/change-password', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const createEvent = (data, token) =>
  axios.post('http://localhost:8080/api/v1/events', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyEvents = (token) =>
  axios.get('http://localhost:8080/api/v1/events/my', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyArchivedEvents = (token) =>
  axios.get('http://localhost:8080/api/v1/events/my/archived', {
    headers: { Authorization: `Bearer ${token}` },
  });