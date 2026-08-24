import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const { getCurrentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(user => {
        if (!active) return;
        const destination = user.role === 'admin' ? '/admin/dashboard' : user.role === 'organizer' ? '/organizer/dashboard' : '/student/dashboard';
        navigate(destination, { replace: true });
      })
      .catch(() => {
        if (!active) return;
        const params = new URLSearchParams(location.search);
        navigate(`/login?oauthError=${encodeURIComponent(params.get('provider') ? `${params.get('provider')} login could not be completed.` : 'Social login could not be completed.')}`, { replace: true });
      });
    return () => { active = false; };
  }, [getCurrentUser, navigate, location.search]);

  return <div className="grid min-h-screen place-items-center text-sm font-semibold text-gray-500">Signing you into CampusPulse...</div>;
}
