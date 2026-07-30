import { useEffect, useRef } from 'react';
import { Link, Navigate, Outlet, createBrowserRouter } from 'react-router';
import Login from '../features/auth/ui/pages/Login.jsx';
import Register from '../features/auth/ui/pages/Register.jsx';
import ChatHome from '../features/chat/ui/pages/ChatHome.jsx';
import ProtectedRoute from '../features/auth/ui/components/ProtectedRoute.jsx';
import useAuth from '../features/auth/hooks/useAuth.js';
import useChat from '../features/chat/hooks/useChat.js';

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
  const {
    reset,
    conversations,
    selectedConversationId,
    chooseConversation,
    loadConversations,
    isLoadingConversations,
  } = useChat();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      loadConversations();
    }
  }, [ loadConversations ]);

  return (
    <main className="h-screen bg-black text-zinc-100">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden w-[260px] flex-col border-r border-white/10 bg-[#0f0f10] md:flex">
          <div className="border-b border-white/10 p-4">
            <Link to="/chat" className="text-2xl font-semibold tracking-tight text-zinc-100">
              ChatGPT
            </Link>
          </div>

          <div className="p-3">
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-xl border border-white/10 bg-zinc-800/60 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-700/60"
            >
              + New chat
            </button>
          </div>

          <div className="chat-scrollbar flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {isLoadingConversations ? (
              <p className="px-2 py-1 text-xs text-zinc-500">Loading conversations...</p>
            ) : null}

            {!isLoadingConversations && conversations.length === 0 ? (
              <p className="px-2 py-1 text-xs text-zinc-500">No conversations yet</p>
            ) : null}

            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => chooseConversation(conversation.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedConversationId === conversation.id
                    ? 'bg-zinc-700/70 text-zinc-100'
                    : 'text-zinc-300 hover:bg-zinc-800/80'
                }`}
                title={conversation.title}
              >
                <span className="block truncate">{conversation.title || 'Untitled chat'}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto border-t border-white/10 p-4 text-sm text-zinc-400">
            MERN Boilerplate
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <Outlet />
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
