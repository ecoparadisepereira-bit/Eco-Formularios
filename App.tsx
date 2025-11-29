import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Admin/Dashboard';
import { FormBuilder } from './components/Admin/FormBuilder';
import { ResponseViewer } from './components/Admin/ResponseViewer';
import { Login } from './components/Admin/Login';
import { FormRenderer } from './components/Client/FormRenderer';
import { storageService } from './services/storageService';
import { FormSchema } from './types';
import { LogOutIcon } from './components/ui/Icons';
import { decodeFormFromUrl } from './utils';

// Routing state
type ViewState = 'login' | 'dashboard' | 'builder' | 'responses' | 'client';

function App() {
  const [view, setView] = useState<ViewState>('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [currentForm, setCurrentForm] = useState<FormSchema | null>(null);
  const [isPublicView, setIsPublicView] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check for Shared URL (?data=...)
    const params = new URLSearchParams(window.location.search);
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

    // 2. If not shared, check Admin Session
    const session = localStorage.getItem('novaform_session');
    if (session === 'true') {
      setIsLoggedIn(true);
      setView('dashboard');
      refreshForms();
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('novaform_session', 'true');
    setIsLoggedIn(true);
    refreshForms();
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('novaform_session');
    setIsLoggedIn(false);
    setView('login');
  };

  const refreshForms = () => {
    setForms(storageService.getForms());
  };

  const handleCreate = () => {
    setCurrentForm(null);
    setView('builder');
  };

  const handleEdit = (form: FormSchema) => {
    setCurrentForm(form);
    setView('builder');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este formulario? Se borrarán también las respuestas asociadas.')) {
      storageService.deleteForm(id);
      refreshForms();
    }
  };

  const handleToggleStatus = (form: FormSchema) => {
    const updated = { ...form, isActive: !form.isActive };
    storageService.saveForm(updated);
    refreshForms();
  };

  const handleSaveForm = (form: FormSchema) => {
    storageService.saveForm(form);
    refreshForms();
    setView('dashboard');
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

  // 0. Error View
  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border border-gray-100">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Enlace Inválido</h2>
                <p className="text-gray-500">{error}</p>
                <button 
                    onClick={() => { setError(null); window.history.replaceState({}, '', window.location.pathname); }} 
                    className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    Ir al Inicio
                </button>
            </div>
        </div>
    );
  }

  // 1. Public View (No Login required)
  if (isPublicView && currentForm) {
    return <FormRenderer form={currentForm} />;
  }

  // 2. Login View
  if (!isLoggedIn && view === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // 3. Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* Top Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="w-8 h-8 bg-[#043200] rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-green-900/20">E</div>
              <span className="font-bold text-xl tracking-tight text-[#043200]">Formularios Ecoparadise</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs font-semibold px-3 py-1 bg-green-50 text-green-800 rounded-full border border-green-100">Administrador</span>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOutIcon className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main>
        {view === 'dashboard' && (
          <Dashboard 
            forms={forms}
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

        {/* Admin Preview Mode (Allows Back button) */}
        {view === 'client' && currentForm && (
          <FormRenderer 
            form={currentForm}
            onBack={() => setView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default App;