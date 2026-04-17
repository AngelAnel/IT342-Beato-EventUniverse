import { useEffect } from 'react';

export default function OAuth2Callback() {

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      const firstName = params.get('firstName') || '';
      const lastName = params.get('lastName') || '';
      const email = params.get('email') || '';
      const role = params.get('role') || 'Participant';
      const department = params.get('department') || 'Not Specified';
      const id = params.get('id') || '';

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id, email, firstName, lastName, role, department,
      }));

      window.location.replace('/dashboard/participant');
    } else {
      window.location.replace('/login');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f0e8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <p style={{
        fontFamily: 'Georgia, serif',
        color: '#6b1a1a',
        fontSize: '18px',
      }}>
        Logging you in with Google...
      </p>
    </div>
  );
}