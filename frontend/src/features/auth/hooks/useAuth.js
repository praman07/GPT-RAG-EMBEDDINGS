import { useDispatch, useSelector } from 'react-redux';
import {
    clearAuthError,
    fetchMe,
    loginUser,
    logoutUser,
    registerUser,
} from '../state/authSlice.js';

/**
 * Auth feature hook that exposes state and auth actions to UI layer.
 *
 * @returns {{
 *  user: any,
 *  loading: boolean,
 *  error: string | null,
 *  isAuthenticated: boolean,
 *  register: (payload: {name: string, email: string, password: string}) => Promise<any>,
 *  login: (payload: {email: string, password: string}) => Promise<any>,
 *  logout: () => Promise<any>,
 *  me: () => Promise<any>,
 *  clearError: () => {type: string}
 * }}
 */
const useAuth = () => {
    const dispatch = useDispatch();
    const authState = useSelector((state) => state.auth);

    const register = (payload) => dispatch(registerUser(payload));
    const login = (payload) => dispatch(loginUser(payload));
    const logout = () => dispatch(logoutUser());
    const me = () => dispatch(fetchMe());
    const clearError = () => dispatch(clearAuthError());

    return {
        ...authState,
        register,
        login,
        logout,
        me,
        clearError,
    };
};

export default useAuth;
