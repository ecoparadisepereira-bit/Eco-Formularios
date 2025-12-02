import React, { useState } from 'react';
import { FormSchema } from '../../types';
import { PlusIcon, EditIcon, TrashIcon, CheckIcon, TableIcon, LinkIcon } from '../ui/Icons';

interface DashboardProps {
  forms: FormSchema[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (form: FormSchema) => void;
  onDelete: (id: string) => void;
  onViewClient: (form: FormSchema) => void;
  onViewResponses: (form: FormSchema) => void;
  onToggleStatus: (form: FormSchema) => void;
}

const PRODUCTION_URL = "https://eco-formularios.vercel.app";

export const Dashboard: React.FC<DashboardProps> = ({ 
  forms, 
  isLoading,
  onCreate, 
  onEdit, 
  onDelete, 
  onViewClient, 
  onViewResponses,
  onToggleStatus 
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (form: FormSchema) => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const currentBase = window.location.href.split('?')[0].replace(/\/$/, '');
    const targetBase = isLocal ? PRODUCTION_URL.replace(/\/$/, '') : currentBase;
    const url = `${targetBase}?id=${form.id}`;
    
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(form.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Stats Calculations
  const totalForms = forms.length;
  const activeForms = forms.filter(f => f.isActive).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Bienvenido de nuevo</h1>
          <p className="text-dark-muted mt-1">Aquí está lo que está pasando con tus formularios hoy.</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 bg-eco-500 text-dark-900 px-6 py-3 rounded-xl hover:bg-eco-400 transition-all font-bold shadow-glow"
        >
          <PlusIcon className="w-5 h-5" />
          Crear Nuevo
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-card">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-dark-muted text-sm font-medium">Total Formularios</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{totalForms}</h3>
                  </div>
                  <div className="p-3 bg-dark-700 rounded-xl text-eco-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-eco-400 bg-eco-500/10 w-fit px-2 py-1 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <span>Sincronizado</span>
              </div>
          </div>
          
          <div className="bg-dark-800 border border-dark-700 p-6 rounded-2xl shadow-card">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-dark-muted text-sm font-medium">Activos</p>
                      <h3 className="text-3xl font-bold text-white mt-1">{activeForms}</h3>
                  </div>
                  <div className="p-3 bg-dark-700 rounded-xl text-blue-400">
                     <CheckIcon className="w-6 h-6" />
                  </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-dark-muted">
                  <span>Listos para recibir respuestas</span>
              </div>
          </div>

          <div className="bg-gradient-to-br from-eco-900 to-dark-800 border border-dark-700 p-6 rounded-2xl shadow-card relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-eco-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none"></div>
               <div>
                  <h3 className="text-white font-bold text-lg mb-2">Ecoparadise AI</h3>
                  <p className="text-dark-muted text-sm mb-4">Usa nuestro generador mágico para crear formularios en segundos.</p>
                  <button onClick={onCreate} className="text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors">
                      Probar ahora &rarr;
                  </button>
               </div>
          </div>
      </div>

      <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-6">Tus Formularios</h2>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-dark-800/50 rounded-2xl border border-dark-700 border-dashed">
                <div className="w-10 h-10 border-4 border-dark-600 border-t-eco-500 rounded-full animate-spin mb-4"></div>
                <p className="text-dark-muted font-medium">Sincronizando datos...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-20 bg-dark-800 rounded-2xl border border-dark-700 border-dashed">
              <div className="bg-dark-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="w-8 h-8 text-dark-muted" />
              </div>
              <h3 className="text-lg font-medium text-white">No hay formularios</h3>
              <p className="text-dark-muted mt-1 max-w-sm mx-auto">Crea el primero para empezar a recolectar datos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map(form => (
                <div key={form.id} className="bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-eco-500/50 transition-all duration-300 group flex flex-col justify-between h-full shadow-card hover:shadow-glow">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${form.isActive ? 'bg-eco-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></span>
                          <span className={`text-xs font-medium ${form.isActive ? 'text-eco-400' : 'text-gray-500'}`}>
                            {form.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => onToggleStatus(form)} title={form.isActive ? "Desactivar" : "Activar"} className="p-2 hover:bg-dark-700 rounded-lg text-dark-muted hover:text-white transition-colors">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => onEdit(form)} title="Editar" className="p-2 hover:bg-dark-700 rounded-lg text-dark-muted hover:text-white transition-colors">
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => onDelete(form.id)} title="Eliminar" className="p-2 hover:bg-red-900/30 rounded-lg text-dark-muted hover:text-red-400 transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2 truncate" title={form.title}>{form.title}</h3>
                    <p className="text-sm text-dark-muted line-clamp-2 h-10 mb-4">{form.description || 'Sin descripción'}</p>
                    
                    <div className="flex items-center gap-2 mb-6">
                         <span className="text-[10px] font-mono bg-dark-900 text-dark-muted px-2 py-1 rounded border border-dark-700">ID: {form.id}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                      onClick={() => handleShare(form)}
                      className={`col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-sm transition-all ${copiedId === form.id ? 'bg-eco-500 text-dark-900' : 'bg-dark-700 text-white hover:bg-dark-600'}`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      {copiedId === form.id ? '¡Copiado!' : 'Copiar Enlace'}
                    </button>
                    <button 
                      onClick={() => onViewResponses(form)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-dark-900 border border-dark-700 text-dark-muted font-medium rounded-xl hover:text-white hover:border-dark-600 transition-all text-sm"
                    >
                      <TableIcon className="w-4 h-4" />
                      Datos
                    </button>
                    <button 
                      onClick={() => onViewClient(form)}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 bg-dark-900 border border-dark-700 text-dark-muted font-medium rounded-xl hover:text-white hover:border-dark-600 transition-all text-sm"
                    >
                      Vista
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
};