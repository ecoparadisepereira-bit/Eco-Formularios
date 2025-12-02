import React, { useState } from 'react';
import { ParrotLogo } from '../ui/Icons';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-eco-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="mb-8 flex flex-col items-center relative z-10">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-dark-900 mb-6 shadow-glow border border-white/10">
           <ParrotLogo className="w-16 h-16 drop-shadow-xl" />
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight text-center">Ecoparadise</h1>
        <p className="text-dark-muted mt-2">Plataforma de Gestión</p>
      </div>

      <div className="bg-dark-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-dark-700 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Usuario</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none transition-all placeholder-dark-600"
              placeholder="admin"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none transition-all placeholder-dark-600"
              placeholder="•••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-3.5 bg-eco-500 hover:bg-eco-400 text-dark-900 font-bold rounded-xl transition-all shadow-glow hover:translate-y-[-2px]"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-dark-muted text-sm relative z-10">
         Powered by <span className="text-white font-semibold">Gemini AI</span>
      </div>
    </div>
  );
};