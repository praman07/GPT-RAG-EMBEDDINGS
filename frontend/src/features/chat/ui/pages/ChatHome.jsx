import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import useAuth from '../../../auth/hooks/useAuth.js';

const ChatHome = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl shadow-black/50">
      <p className="mb-2 text-sm uppercase tracking-[0.24em] text-zinc-300">Workspace</p>
      <h1 className="text-3xl font-semibold text-zinc-100">What&apos;s on your mind today?</h1>
      <p className="mt-4 text-zinc-400">
        Signed in as <span className="font-medium text-zinc-200">{user?.email}</span>
      </p>
      <div className="mt-8 rounded-full border border-white/10 bg-zinc-800/80 px-5 py-4 text-zinc-400">
        Ask anything...
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 rounded-full border border-white/10 bg-zinc-900/80 px-5 py-2.5 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
      >
        Logout
      </button>
    </div>
  );
};

export default ChatHome;
