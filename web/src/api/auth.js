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

  export const getParticipantEvents = (token) =>
  axios.get('http://localhost:8080/api/v1/events/participant', {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const submitRegistration = (data, token) =>
  axios.post('http://localhost:8080/api/v1/registrations', data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getSlotCounts = (eventId, token) =>
  axios.get(`http://localhost:8080/api/v1/registrations/event/${eventId}/slot-counts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyRegistrations = (token) =>
  axios.get('http://localhost:8080/api/v1/registrations/my', {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const getEventRegistrations = (eventId, token) =>
  axios.get(`http://localhost:8080/api/v1/registrations/event/${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const confirmRegistration = (registrationId, token) =>
  axios.put(`http://localhost:8080/api/v1/registrations/${registrationId}/confirm`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyConfirmedRegistrations = (token) =>
  axios.get('http://localhost:8080/api/v1/registrations/my/confirmed', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getNotifications = (token) =>
  axios.get('http://localhost:8080/api/v1/notifications', {
    headers: { Authorization: `Bearer ${token}` },
  });

export const markNotificationsRead = (token) =>
  axios.put('http://localhost:8080/api/v1/notifications/mark-read', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const getMyArchivedRegistrations = (token) =>
  axios.get('http://localhost:8080/api/v1/registrations/my/archived', {
    headers: { Authorization: `Bearer ${token}` },
  });

  export const updateEvent = (id, data, token) =>
  axios.put(`http://localhost:8080/api/v1/events/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteEvent = (id, token) =>
  axios.delete(`http://localhost:8080/api/v1/events/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });