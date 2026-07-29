import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { loginApi, logoutApi, meApi, registerApi } from '../api/authApi.js';

const initialState = {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    isAuthChecked: false,
};

export const registerUser = createAsyncThunk('auth/registerUser', async (payload) => {
    return registerApi(payload);
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload) => {
    return loginApi(payload);
});

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
    return meApi();
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
    return logoutApi();
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
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
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
                state.isAuthChecked = true;
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
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.isAuthChecked = true;
            });
    },
});

export const { clearAuthError } = authSlice.actions;

export default authSlice.reducer;
