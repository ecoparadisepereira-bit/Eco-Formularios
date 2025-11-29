import React, { useState } from 'react';
import { SparklesIcon } from '../ui/Icons';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulación de autenticación simple
    // En un caso real, esto validaría contra un backend
    if (email === 'admin' && password === 'admin') {
      onLogin();
    } else {
      setError('Credenciales incorrectas (Prueba con: admin / admin)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-12 h-12 bg-[#043200] rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-green-900/20">
           <SparklesIcon className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Formularios Ecoparadise</h1>
        <p className="text-gray-500">Acceso Administrativo</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#043200] focus:ring-4 focus:ring-green-900/10 outline-none transition-all"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#043200] focus:ring-4 focus:ring-green-900/10 outline-none transition-all"
              placeholder="•••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-3 bg-[#043200] hover:bg-[#064e00] text-white font-bold rounded-xl transition-colors shadow-lg shadow-green-900/20"
          >
            Ingresar al Dashboard
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
            Cuentas de usuario protegidas por simulación segura.
        </div>
      </div>
    </div>
  );
};