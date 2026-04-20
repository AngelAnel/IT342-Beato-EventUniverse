import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginParticipant from './pages/LoginParticipant';
import LoginOrganizer from './pages/LoginOrganizer';
import RegisterParticipant from './pages/RegisterParticipant';
import RegisterOrganizer from './pages/RegisterOrganizer';
import ParticipantDashboard from './pages/ParticipantDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AddEventPage from './pages/AddEventPage';
import OAuth2Callback from './pages/OAuth2Callback';
import ParticipantProfile from './pages/ParticipantProfile';
import OrganizerProfile from './pages/OrganizerProfile';

function ProtectedRoute({ children, allowedRole }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  if (!token || !user) return <Navigate to="/" />;
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
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/participant" element={<LoginParticipant />} />
        <Route path="/login/organizer" element={<LoginOrganizer />} />
        <Route path="/register/participant" element={<RegisterParticipant />} />
        <Route path="/register/organizer" element={<RegisterOrganizer />} />
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
        <Route path="/profile/participant" element={
          <ProtectedRoute allowedRole="Participant">
            <ParticipantProfile />
          </ProtectedRoute>
        } />
        <Route path="/profile/organizer" element={
          <ProtectedRoute allowedRole="Organization">
            <OrganizerProfile />
          </ProtectedRoute>
        } />
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        <Route path="/organizer/add-event" element={
          <ProtectedRoute allowedRole="Organization">
            <AddEventPage />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/register" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}