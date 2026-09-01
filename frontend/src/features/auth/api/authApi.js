/**
 * Parses API responses and throws normalized JS errors for non-2xx responses.
 *
 * @param {Response} response
 * @returns {Promise<any>}
 */
const parseResponse = async (response) => {
    let data;
    try {
        data = await response.json();
    } catch (e) {
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        throw new Error('Invalid response received from server');
    }

    if (!response.ok) {
        throw new Error(data?.message || 'Request failed');
    }

    return data;
};

/**
 * Executes a cookie-authenticated request to auth endpoints.
 *
 * @param {string} url
 * @param {string} [method='GET']
 * @param {Record<string, unknown>} [body]
 * @returns {Promise<any>}
 */
const authRequest = async (url, method = 'GET', body) => {
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    return parseResponse(response);
};

/**
 * Registers a user and sets the auth cookie.
 *
 * @param {{name: string, email: string, password: string}} payload
 * @returns {Promise<any>}
 */
export const registerApi = (payload) => authRequest('/api/auth/register', 'POST', payload);

/**
 * Logs in a user and sets the auth cookie.
 *
 * @param {{email: string, password: string}} payload
 * @returns {Promise<any>}
 */
export const loginApi = (payload) => authRequest('/api/auth/login', 'POST', payload);

/**
 * Switches current session token to a saved account token.
 *
 * @param {string} token
 * @returns {Promise<any>}
 */
export const switchAccountApi = (token) => authRequest('/api/auth/switch', 'POST', { token });

/**
 * Fetches currently authenticated user from cookie token.
 *
 * @returns {Promise<any>}
 */
export const meApi = () => authRequest('/api/auth/me');

/**
 * Clears auth cookie and invalidates local session state.
 *
 * @returns {Promise<any>}
 */
export const logoutApi = () => authRequest('/api/auth/logout', 'POST');
