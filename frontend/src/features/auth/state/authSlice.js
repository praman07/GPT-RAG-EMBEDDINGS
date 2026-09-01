import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginApi, logoutApi, meApi, registerApi, switchAccountApi } from '../api/authApi.js';

// Local storage helpers for multi-account management
const ACCOUNTS_STORAGE_KEY = 'override_saved_accounts';

export const getSavedAccounts = () => {
    try {
        const data = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};

const storeAccountInStorage = (user, token) => {
    if (!user || !token) return;
    try {
        const existing = getSavedAccounts();
        const updated = existing.filter((acc) => acc.user.id !== user.id && acc.user.email !== user.email);
        updated.unshift({ user, token, lastActive: Date.now() });
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error('Failed to store account in localStorage', e);
    }
};

export const removeAccountFromStorage = (userId) => {
    try {
        const existing = getSavedAccounts();
        const updated = existing.filter((acc) => acc.user.id !== userId);
        localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch {
        return [];
    }
};

const initialState = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    isAuthChecked: false,
    savedAccounts: getSavedAccounts(),
};

export const registerUser = createAsyncThunk('auth/registerUser', async (payload) => {
    return registerApi(payload);
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload) => {
    return loginApi(payload);
});

export const switchUserAccount = createAsyncThunk('auth/switchUserAccount', async (token) => {
    return switchAccountApi(token);
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
    return meApi();
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch, getState }) => {
    const currentState = getState().auth;
    const currentId = currentState.user?.id;
    const remainingAccounts = removeAccountFromStorage(currentId);

    try {
        await logoutApi();
    } catch (e) {
        console.error('Logout API call error:', e);
    }

    if (remainingAccounts.length > 0) {
        const nextAccount = remainingAccounts[0];
        const switchResult = await dispatch(switchUserAccount(nextAccount.token));
        if (switchUserAccount.fulfilled.match(switchResult)) {
            return { switchedToNext: true, user: switchResult.payload.user, remainingAccounts };
        }
    }

    return { switchedToNext: false, remainingAccounts: [] };
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
        prepareAddAccount: (state) => {
            state.user = null;
            state.isAuthenticated = false;
        },
        removeSavedAccount: (state, action) => {
            const userId = action.payload;
            state.savedAccounts = removeAccountFromStorage(userId);
        },
        refreshSavedAccounts: (state) => {
            state.savedAccounts = getSavedAccounts();
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.isAuthChecked = true;
                storeAccountInStorage(action.payload.user, action.payload.token);
                state.savedAccounts = getSavedAccounts();
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                state.isAuthChecked = true;
            })
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.isAuthChecked = true;
                storeAccountInStorage(action.payload.user, action.payload.token);
                state.savedAccounts = getSavedAccounts();
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                state.isAuthChecked = true;
            })
            .addCase(switchUserAccount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(switchUserAccount.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.isAuthChecked = true;
                storeAccountInStorage(action.payload.user, action.payload.token);
                state.savedAccounts = getSavedAccounts();
            })
            .addCase(switchUserAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            .addCase(fetchMe.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.isAuthChecked = true;
            })
            .addCase(fetchMe.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.isAuthChecked = true;
            })
            .addCase(logoutUser.fulfilled, (state, action) => {
                const { switchedToNext, remainingAccounts } = action.payload || {};
                state.savedAccounts = remainingAccounts || getSavedAccounts();

                if (!switchedToNext) {
                    state.user = null;
                    state.isAuthenticated = false;
                    state.isAuthChecked = true;
                }
            });
    },
});

export const { clearAuthError, prepareAddAccount, removeSavedAccount, refreshSavedAccounts } = authSlice.actions;

export default authSlice.reducer;
