import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginParticipant from './features/auth/LoginParticipant';
import LoginOrganizer from './features/auth/LoginOrganizer';
import RegisterParticipant from './features/auth/RegisterParticipant';
import RegisterOrganizer from './features/auth/RegisterOrganizer';
import OrganizerDashboard from './features/dashboard/OrganizerDashboard';
import AddEventPage from './features/event/AddEventPage';
import OAuth2Callback from './features/auth/OAuth2Callback';
import ParticipantProfile from './features/profile/ParticipantProfile';
import OrganizerProfile from './features/profile/OrganizerProfile';
import EditEventPage from './features/event/EditEventPage';
import LandingPage from './features/auth/LandingPage'
import ParticipantDashboard from './features/dashboard/ParticipantDashboard'

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
        <Route path="/organizer/edit-event" element={<EditEventPage />} />
      </Routes>
    </BrowserRouter>
  );
}