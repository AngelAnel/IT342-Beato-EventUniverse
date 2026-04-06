import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ParticipantDashboard from './pages/ParticipantDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AddEventPage from './pages/AddEventPage';

function ProtectedRoute({ children, allowedRole }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || !user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) {
    return user.role === 'Participant'
      ? <Navigate to="/dashboard/participant" />
      : <Navigate to="/dashboard/organizer" />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard/participant" element={
          <ProtectedRoute allowedRole="Participant">
            <ParticipantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/organizer" element={
          <ProtectedRoute allowedRole="Organization">
            <OrganizerDashboard />
          </ProtectedRoute>
        } />

        <Route path="/organizer/add-event" element={
          <ProtectedRoute allowedRole="Organization">
            <AddEventPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}