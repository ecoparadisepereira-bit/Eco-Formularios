import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Admin/Dashboard';
import { FormBuilder } from './components/Admin/FormBuilder';
import { ResponseViewer } from './components/Admin/ResponseViewer';
import { Login } from './components/Admin/Login';
import { FormRenderer } from './components/Client/FormRenderer';
import { storageService } from './services/storageService';
import { FormSchema } from './types';
import { LogOutIcon, SparklesIcon, TableIcon, PlusIcon } from './components/ui/Icons';
import { decodeFormFromUrl } from './utils';

type ViewState = 'login' | 'dashboard' | 'builder' | 'responses' | 'client';

function App() {
  const [view, setView] = useState<ViewState>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [currentForm, setCurrentForm] = useState<FormSchema | null>(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [loadingPublicForm, setLoadingPublicForm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check for Short ID (?id=...)
    const shortId = params.get('id');
    if (shortId) {
        loadPublicFormById(shortId);
        return;
    }

    // Check for Legacy Shared URL (?data=...)
    const sharedData = params.get('data');
    if (sharedData) {
        const sharedForm = decodeFormFromUrl(sharedData);
        if (sharedForm) {
            setCurrentForm(sharedForm);
            setIsPublicView(true);
            setView('client');
            return;
        } else {
            setError("El enlace del formulario es inválido o está dañado.");
            return;
        }
    }

    // Check Admin Session
    const session = localStorage.getItem('novaform_session');
    if (session === 'true') {
      setIsLoggedIn(true);
      setView('dashboard');
      loadFormsFromCloud();
    }
  }, []);

  const loadPublicFormById = async (id: string) => {
      setLoadingPublicForm(true);
      try {
          const form = await storageService.fetchFormById(id);
          if (form) {
              setCurrentForm(form);
              setIsPublicView(true);
              setView('client');
          } else {
              setError("No se encontró el formulario solicitado. Verifica el enlace.");
          }
      } catch (e) {
          setError("Error de conexión al buscar el formulario.");
      } finally {
          setLoadingPublicForm(false);
      }
  };

  const loadFormsFromCloud = async () => {
    setIsLoadingForms(true);
    const data = await storageService.fetchForms();
    setForms(data);
    setIsLoadingForms(false);
  };

  const handleLogin = () => {
    localStorage.setItem('novaform_session', 'true');
    setIsLoggedIn(true);
    loadFormsFromCloud();
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('novaform_session');
    setIsLoggedIn(false);
    setView('login');
  };

  const handleCreate = () => {
    setCurrentForm(null);
    setView('builder');
  };

  const handleEdit = (form: FormSchema) => {
    setCurrentForm(form);
    setView('builder');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este formulario de la Base de Datos?')) {
      setIsLoadingForms(true);
      await storageService.deleteForm(id);
      await loadFormsFromCloud();
    }
  };

  const handleToggleStatus = async (form: FormSchema) => {
    const updated = { ...form, isActive: !form.isActive };
    setIsLoadingForms(true);
    await storageService.saveForm(updated);
    await loadFormsFromCloud();
  };

  const handleSaveForm = async (form: FormSchema) => {
    setIsLoadingForms(true);
    setView('dashboard'); 
    await storageService.saveForm(form);
    await loadFormsFromCloud();
  };

  const handleViewResponses = (form: FormSchema) => {
    setCurrentForm(form);
    setView('responses');
  };

  const handleViewClient = (form: FormSchema) => {
    setCurrentForm(form);
    setView('client');
  };

  // --- RENDERING ---

  if (loadingPublicForm) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 text-white">
            <div className="w-12 h-12 border-4 border-dark-700 border-t-eco-400 rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold text-eco-400">Cargando Formulario...</h2>
            <p className="text-dark-muted">Conectando con Ecoparadise Cloud</p>
        </div>
      );
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
            <div className="bg-dark-800 p-8 rounded-2xl border border-dark-700 text-center max-w-md shadow-card">
                <div className="w-16 h-16 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Error</h2>
                <p className="text-dark-muted">{error}</p>
                <button 
                    onClick={() => { setError(null); window.history.replaceState({}, '', window.location.pathname); window.location.reload(); }} 
                    className="mt-6 px-6 py-2 bg-eco-500 text-white rounded-lg hover:bg-eco-600 transition-colors"
                >
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
  }

  if (isPublicView && currentForm) {
    return <FormRenderer form={currentForm} />;
  }

  if (!isLoggedIn && view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-dark-900 text-dark-text font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-eco-950 border-r border-dark-800 flex-shrink-0 flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-eco-500 rounded-xl flex items-center justify-center text-white shadow-glow">
                <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
                <h1 className="font-bold text-lg text-white leading-tight">Ecoparadise</h1>
                <p className="text-xs text-eco-400 font-medium">Admin Panel</p>
            </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            <button 
                onClick={() => setView('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-eco-500/10 text-eco-400 border border-eco-500/20' : 'text-dark-muted hover:text-white hover:bg-dark-800'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                <span className="font-medium">Dashboard</span>
            </button>
            
            <button 
                onClick={handleCreate}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'builder' && !currentForm ? 'bg-eco-500/10 text-eco-400 border border-eco-500/20' : 'text-dark-muted hover:text-white hover:bg-dark-800'}`}
            >
                <PlusIcon className="w-5 h-5" />
                <span className="font-medium">Crear Formulario</span>
            </button>

            <div className="pt-4 mt-4 border-t border-dark-800">
                <p className="px-4 text-xs font-bold text-dark-muted uppercase mb-2 tracking-wider">Formularios Activos</p>
                {forms.slice(0, 4).map(f => (
                    <button 
                        key={f.id}
                        onClick={() => handleEdit(f)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dark-muted hover:text-white rounded-lg hover:bg-dark-800 transition-colors truncate"
                    >
                        <span className="w-2 h-2 rounded-full bg-eco-500 flex-shrink-0" />
                        <span className="truncate">{f.title}</span>
                    </button>
                ))}
            </div>
        </nav>

        <div className="p-4 border-t border-dark-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800 border border-dark-700">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-eco-600 to-eco-400 flex items-center justify-center text-white font-bold">
                    AD
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Admin User</p>
                    <p className="text-xs text-dark-muted truncate">admin@ecoparadise.com</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-dark-muted hover:text-red-400 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOutIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto relative">
        {/* Top Header Mockup for "Search" look from image */}
        <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-md border-b border-dark-800 px-8 py-4 flex justify-between items-center">
             <div className="flex items-center gap-4 text-dark-muted">
                 <span className="text-sm">Ecoparadise</span>
                 <span>/</span>
                 <span className="text-white font-medium">{view === 'dashboard' ? 'Panel Principal' : view === 'builder' ? 'Editor' : 'Respuestas'}</span>
             </div>
             <div className="flex items-center gap-4">
                 <div className="bg-dark-800 border border-dark-700 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-dark-muted w-64">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                    <span>Buscar...</span>
                 </div>
                 <button className="w-10 h-10 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-dark-muted hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                 </button>
             </div>
        </header>

        <div className="p-8">
            {view === 'dashboard' && (
            <Dashboard 
                forms={forms}
                isLoading={isLoadingForms}
                onCreate={handleCreate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewClient={handleViewClient}
                onViewResponses={handleViewResponses}
                onToggleStatus={handleToggleStatus}
            />
            )}

            {view === 'builder' && (
            <FormBuilder 
                initialData={currentForm}
                onSave={handleSaveForm}
                onCancel={() => setView('dashboard')}
            />
            )}

            {view === 'responses' && currentForm && (
            <ResponseViewer
                form={currentForm}
                onBack={() => setView('dashboard')}
            />
            )}

            {view === 'client' && currentForm && (
            <FormRenderer 
                form={currentForm}
                onBack={() => setView('dashboard')}
            />
            )}
        </div>
      </main>
    </div>
  );
}

export default App;