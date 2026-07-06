import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Swords, Loader2 } from 'lucide-react';
import api from '../utils/api';

// === BULLETPROOF EMAIL VALIDATOR ===
const validateEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(email)) return { isValid: false, message: "Please enter a valid email format." };
  const domain = email.split('@')[1].toLowerCase();
  const allowedDomains = ['gmail.com', 'yahoo.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'icloud.com', 'dtu.ac.in'];
  if (!allowedDomains.includes(domain)) return { isValid: false, message: "Please use a supported email provider." };
  return { isValid: true };
};

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        setIsLoading(false);
        return; 
      }
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        setError(emailValidation.message);
        setIsLoading(false);
        return; 
      }
      
      try {
        const response = await api.post('/auth/register', {
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
        login(response.data); 
        navigate('/dashboard', { replace: true }); 
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    } 
    else {
      try {
        const response = await api.post('/auth/login', { 
          username: formData.username, 
          password: formData.password 
        });
        login(response.data);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans selection:bg-amber-500/30 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 shadow-2xl relative z-10 animate-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)] group hover:scale-105 transition-transform">
            <Swords className="text-amber-500 group-hover:rotate-12 transition-transform duration-300" size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide text-center drop-shadow-sm">
            {isLogin ? 'Enter Arena' : 'Forge Legacy'}
          </h2>
          <p className="text-neutral-500 mt-3 text-sm tracking-wide text-center">
            {isLogin ? 'Authenticate to access your dashboard' : 'Initialize your combat profile'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium tracking-wide text-center shadow-[0_0_15px_rgba(225,29,72,0.1)]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input 
            type="text" 
            placeholder="Username" 
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
            className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-600"
          />

          {!isLogin && (
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-600"
            />
          )}

          <input 
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-600"
          />

          {!isLogin && (
            <input 
              type="password" 
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              className="w-full bg-[#111] border border-white/5 rounded-xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-600"
            />
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-base tracking-wide p-4 rounded-xl transition-all duration-300 mt-4 flex justify-center items-center h-14 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-neutral-500 hover:text-amber-500 text-sm font-semibold tracking-wide transition-colors"
          >
            {isLogin ? "No account? Register here" : "Have an account? Login here"}
          </button>
        </div>
      </div>
    </div>
  );
}