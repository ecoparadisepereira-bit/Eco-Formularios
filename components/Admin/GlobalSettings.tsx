
import React, { useState, useEffect } from 'react';
import { AppConfig } from '../../types';
import { CheckIcon, ImageIcon, TextIcon } from '../ui/Icons';

interface GlobalSettingsProps {
    config: AppConfig;
    onSave: (newConfig: AppConfig) => void;
}

export const GlobalSettings: React.FC<GlobalSettingsProps> = ({ config, onSave }) => {
    const [formData, setFormData] = useState<AppConfig>(config);
    const [saved, setSaved] = useState(false);

    const handleChange = (key: keyof AppConfig, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Configuración</h1>
            <p className="text-dark-muted mb-8">Personaliza la identidad de tu aplicación (Marca Blanca).</p>

            <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-card space-y-6">
                
                {/* App Name */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide text-xs flex items-center gap-2">
                        <TextIcon className="w-4 h-4 text-eco-400" />
                        Nombre de la Aplicación
                    </label>
                    <input 
                        type="text" 
                        value={formData.appName}
                        onChange={(e) => handleChange('appName', e.target.value)}
                        className="w-full px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 transition-all placeholder-dark-600"
                        placeholder="Ej: Ecoparadise"
                    />
                    <p className="text-[10px] text-dark-muted">Este nombre aparecerá en el título de la pestaña y en el menú lateral.</p>
                </div>

                {/* Logo URL */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide text-xs flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-eco-400" />
                        URL del Logo (Login & Sidebar)
                    </label>
                    <div className="flex gap-4 items-start">
                        <input 
                            type="url" 
                            value={formData.logoUrl}
                            onChange={(e) => handleChange('logoUrl', e.target.value)}
                            className="flex-1 px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 transition-all placeholder-dark-600"
                            placeholder="https://..."
                        />
                        <div className="w-12 h-12 bg-dark-900 border border-dark-600 rounded-xl flex items-center justify-center p-2">
                            <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                    </div>
                </div>

                {/* Favicon URL */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-300 uppercase tracking-wide text-xs flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-eco-400" />
                        URL del Favicon (Pestaña Navegador)
                    </label>
                    <div className="flex gap-4 items-start">
                        <input 
                            type="url" 
                            value={formData.faviconUrl}
                            onChange={(e) => handleChange('faviconUrl', e.target.value)}
                            className="flex-1 px-4 py-3 bg-dark-900 border border-dark-600 rounded-xl text-white outline-none focus:border-eco-500 focus:ring-1 focus:ring-eco-500 transition-all placeholder-dark-600"
                            placeholder="https://..."
                        />
                         <div className="w-12 h-12 bg-dark-900 border border-dark-600 rounded-xl flex items-center justify-center p-3">
                            <img src={formData.faviconUrl} alt="Preview" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-dark-700 flex justify-end">
                    <button 
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 bg-eco-500 text-dark-900 font-bold rounded-xl hover:bg-eco-400 transition-all shadow-glow"
                    >
                        {saved ? (
                            <>
                                <CheckIcon className="w-5 h-5" />
                                ¡Guardado!
                            </>
                        ) : (
                            "Guardar Configuración"
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
};
