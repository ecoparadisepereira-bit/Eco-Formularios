
import React, { useState } from 'react';
import { DynamicLogo } from '../ui/Icons';
import { AppConfig } from '../../types';

interface LoginProps {
  onLogin: () => void;
  appConfig: AppConfig;
}

export const Login: React.FC<LoginProps> = ({ onLogin, appConfig }) => {
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

  // Default image if none configured
  const sideImage = appConfig.loginImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop";

  return (
    <div className="min-h-screen flex bg-dark-900">
      
      {/* LEFT SIDE: FORM */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10">
        
        <div className="w-full max-w-md">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                 <DynamicLogo src={appConfig.logoUrl} className="w-6 h-6" />
               </div>
               <span className="font-bold text-xl text-white tracking-tight">{appConfig.appName}</span>
            </div>

            <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">Bienvenido de nuevo</h1>
            <p className="text-dark-muted mb-8 text-lg">Ingresa tus datos para acceder al panel.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Usuario</label>
                <div className="relative">
                    <input 
                    type="text" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-800 border border-dark-700 rounded-xl text-white focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none transition-all placeholder-dark-600"
                    placeholder="admin"
                    />
                    <div className="absolute right-4 top-3.5 text-eco-500">
                       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                </div>
            </div>
            
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                    <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-dark-800 border border-dark-700 rounded-xl text-white focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none transition-all placeholder-dark-600"
                    placeholder="•••••"
                    />
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg font-medium flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    {error}
                </div>
            )}

            <button 
                type="submit" 
                className="w-full py-4 bg-eco-500 hover:bg-eco-400 text-dark-900 font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:-translate-y-0.5"
            >
                Continuar
            </button>
            </form>
            
            <div className="mt-12 pt-6 border-t border-dark-800 text-center text-dark-muted text-sm">
                <p>Plataforma gestionada por <span className="text-white font-semibold">Grupo Restrepo</span></p>
            </div>
        </div>
      </div>

      {/* RIGHT SIDE: IMAGE */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-dark-800">
         <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-dark-900 z-10"></div>
         <img 
            src={sideImage} 
            alt="Login Visual" 
            className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[10s]"
         />
         
         {/* Floating Element Effect */}
         <div className="absolute bottom-20 right-20 bg-dark-900/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl z-20 max-w-xs animate-in slide-in-from-bottom duration-1000">
            <div className="w-12 h-12 bg-eco-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-eco-500/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Seguridad Total</h3>
            <p className="text-dark-muted text-sm leading-relaxed">Tus datos están protegidos con la mejor tecnología de encriptación.</p>
         </div>
      </div>

    </div>
  );
};
