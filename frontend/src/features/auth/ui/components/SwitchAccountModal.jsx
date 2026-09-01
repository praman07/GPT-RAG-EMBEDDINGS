import React from 'react';
import { useNavigate } from 'react-router';
import useAuth from '../../hooks/useAuth.js';
import useChat from '../../../chat/hooks/useChat.js';

export default function SwitchAccountModal({ isOpen, onClose, onNotify }) {
  const navigate = useNavigate();
  const { user, savedAccounts, switchAccount, removeAccount, prepareAddAccount } = useAuth();
  const { reset, loadConversations } = useChat();

  if (!isOpen) return null;

  const activeAccount = savedAccounts.find(
    (acc) => acc.user.id === user?.id || acc.user.email === user?.email
  ) || (user ? { user, token: null } : null);

  const otherAccounts = savedAccounts.filter(
    (acc) => acc.user.id !== user?.id && acc.user.email !== user?.email
  );

  const handleSelectAccount = async (account) => {
    onClose();

    if (account.user.id === user?.id || account.user.email === user?.email) {
      return;
    }

    try {
      const targetEmail = account.user.email || account.user.name;
      const resultAction = await switchAccount(account.token);
      if (switchAccount.fulfilled.match(resultAction)) {
        if (onNotify) {
          onNotify({
            title: 'Account Switched',
            message: `Now logged into ${targetEmail}.`,
          });
        }
        await loadConversations();
        reset();
      }
    } catch (e) {
      console.error('Failed to switch account', e);
    }
  };

  const handleAddAccount = () => {
    onClose();
    prepareAddAccount();
    navigate('/login');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <h3 className="text-base font-semibold text-zinc-100">Switch Account</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Current Logged In Account - Prominent, Full Opacity, Solid Dark Zinc */}
          {activeAccount ? (
            <div
              onClick={() => handleSelectAccount(activeAccount)}
              className="w-full flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-800 p-3.5 opacity-100 cursor-pointer transition hover:bg-zinc-700/80"
              title="Current Active Account (Click to close)"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-100 uppercase">
                  {(activeAccount.user.name || activeAccount.user.email || 'U').slice(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-sm font-semibold text-zinc-100">
                    {activeAccount.user.name || activeAccount.user.email?.split('@')[0]}
                  </span>
                  <span className="truncate text-xs text-zinc-400">{activeAccount.user.email}</span>
                </div>
              </div>
              <svg className="h-5 w-5 text-zinc-300 shrink-0 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : null}

          {/* Other Accounts - Smaller width, slightly faded */}
          {otherAccounts.length > 0 ? (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 px-1">
                Other accounts
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto chat-scrollbar pr-0.5">
                {otherAccounts.map((account) => (
                  <div
                    key={account.user.id || account.user.email}
                    onClick={() => handleSelectAccount(account)}
                    className="group w-[95%] mx-auto flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2.5 opacity-70 hover:opacity-100 hover:border-zinc-700 hover:bg-zinc-800/60 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 uppercase">
                        {(account.user.name || account.user.email || 'U').slice(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-xs font-medium text-zinc-200">
                          {account.user.name || account.user.email?.split('@')[0]}
                        </span>
                        <span className="truncate text-[11px] text-zinc-400">{account.user.email}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAccount(account.user.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      title="Remove account"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={handleAddAccount}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add another account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
