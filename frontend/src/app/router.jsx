import { useEffect, useRef, useState } from 'react';
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
            Override AI
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

const SidebarChatItem = ({ conversation, isSelected, onSelect, onRename, onTogglePin, onDelete }) => {
  const [ isEditing, setIsEditing ] = useState(false);
  const [ editTitle, setEditTitle ] = useState(conversation.title || '');

  useEffect(() => {
    setEditTitle(conversation.title || '');
  }, [ conversation.title ]);

  const handleSaveRename = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSaveRename} className="flex items-center gap-1 px-2 py-1.5">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full rounded border border-white/20 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-white/30"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsEditing(false);
              setEditTitle(conversation.title || '');
            }
          }}
        />
        <button
          type="submit"
          className="rounded p-1 text-xs text-emerald-400 hover:bg-zinc-800 hover:text-emerald-300 transition"
          title="Save"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setEditTitle(conversation.title || '');
          }}
          className="rounded p-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          title="Cancel"
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <div
      onClick={() => onSelect(conversation.id)}
      className={`group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm transition cursor-pointer select-none ${
        isSelected ? 'bg-zinc-700/70 text-zinc-100' : 'text-zinc-300 hover:bg-zinc-800/80'
      }`}
      title={conversation.title}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {conversation.isPinned ? (
          <svg className="h-3.5 w-3.5 text-amber-400 shrink-0" fill="currentColor" viewBox="0 0 24 24" title="Pinned chat">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        ) : null}
        <span className="truncate">{conversation.title || 'Untitled chat'}</span>
      </div>

      <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin(conversation.id);
          }}
          className={`rounded p-1 text-xs transition hover:bg-zinc-800 ${
            conversation.isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-zinc-400 hover:text-zinc-100'
          }`}
          title={conversation.isPinned ? 'Unpin chat' : 'Pin chat'}
        >
          <svg className="h-3.5 w-3.5" fill={conversation.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="rounded p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          title="Rename chat"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this conversation?')) {
              onDelete(conversation.id);
            }
          }}
          className="rounded p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition"
          title="Delete chat"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const ChatLayout = () => {
  const [ isSidebarOpen, setIsSidebarOpen ] = useState(true);
  const {
    reset,
    conversations,
    selectedConversationId,
    chooseConversation,
    loadConversations,
    isLoadingConversations,
    rename,
    togglePin,
    remove,
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
        {/* Sidebar */}
        {isSidebarOpen ? (
          <aside className="flex w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#0f0f10]">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <Link to="/chat" className="text-2xl font-semibold tracking-tight text-zinc-100">
                Override AI
              </Link>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
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
                <SidebarChatItem
                  key={conversation.id}
                  conversation={conversation}
                  isSelected={selectedConversationId === conversation.id}
                  onSelect={chooseConversation}
                  onRename={rename}
                  onTogglePin={togglePin}
                  onDelete={remove}
                />
              ))}
            </div>
          </aside>
        ) : null}

        {/* Main Content Area */}
        <section className="relative flex min-w-0 flex-1 flex-col">
          {!isSidebarOpen ? (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-4 top-4 z-20 rounded-xl border border-white/10 bg-zinc-900/90 p-2 text-zinc-300 backdrop-blur transition hover:bg-zinc-800 hover:text-zinc-100 shadow-md"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          ) : null}

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
