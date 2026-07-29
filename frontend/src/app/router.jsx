import { useEffect, useRef } from 'react';
import { Link, Navigate, Outlet, createBrowserRouter } from 'react-router';
import Login from '../features/auth/ui/pages/Login.jsx';
import Register from '../features/auth/ui/pages/Register.jsx';
import ChatHome from '../features/chat/ui/pages/ChatHome.jsx';
import ProtectedRoute from '../features/auth/ui/components/ProtectedRoute.jsx';
import useAuth from '../features/auth/hooks/useAuth.js';

const AuthBootstrap = () => {
  const { me } = useAuth();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      me();
    }
  }, [me]);

  return <Outlet />;
};

const AuthLayout = () => {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-black px-6 py-4">
          <Link to="/" className="text-lg font-semibold tracking-wide text-zinc-100">
            ChatGPT Clone
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-300"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
            >
              Sign up
            </Link>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center px-6 py-10">
          <Outlet />
        </section>
      </div>
    </main>
  );
};

const ChatLayout = () => {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full  overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/60">
        <aside className="hidden w-72 flex-col justify-between border-r border-white/10 bg-black p-6 lg:flex">
          <div>
            <Link to="/chat" className="text-lg font-semibold tracking-wide text-zinc-100">
              ChatGPT Clone
            </Link>
            <p className="mt-8 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300">
              New chat
            </p>
          </div>

          <p className="text-sm text-zinc-500">MERN Boilerplate</p>
        </aside>

        <section className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-zinc-950 px-6 py-4">
            <h1 className="text-sm tracking-wide text-zinc-300">Chat</h1>
            <Link to="/login" className="text-sm text-zinc-400 transition hover:text-zinc-200">
              Switch account
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center p-6">
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthBootstrap />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        element: <AuthLayout />,
        children: [
          {
            path: 'login',
            element: <Login />,
          },
          {
            path: 'register',
            element: <Register />,
          },
        ],
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <ChatHome />,
          },
        ],
      },
    ],
  },
]);

export default router;
