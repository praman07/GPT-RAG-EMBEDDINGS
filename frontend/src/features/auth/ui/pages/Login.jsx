import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import useAuth from '../../hooks/useAuth.js';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, clearError, login } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from || '/chat';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login(form);
  };

  return (
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl shadow-black/50">
      <p className="text-sm uppercase tracking-[0.26em] text-zinc-300">Welcome back</p>
      <h2 className="mt-2 text-3xl font-semibold text-zinc-100">Log in</h2>
      <p className="mt-1 text-sm text-zinc-400">Continue your ChatGPT-like workspace session.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm text-zinc-300">Email</span>
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none ring-0 transition focus:border-zinc-500"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm text-zinc-300">Password</span>
          <input
            required
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none ring-0 transition focus:border-zinc-500"
            placeholder="••••••••"
          />
        </label>

        {error ? <p className="text-sm text-zinc-300">{error}</p> : null}

        <button
          disabled={loading}
          type="submit"
          className="w-full rounded-xl bg-zinc-100 px-4 py-3 font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-5 text-sm text-zinc-400">
        Need an account?{' '}
        <Link className="text-zinc-200 hover:text-zinc-100" to="/register">
          Sign up
        </Link>
      </p>
    </section>
  );
};

export default Login;
