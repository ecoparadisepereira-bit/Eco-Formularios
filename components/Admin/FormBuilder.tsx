import React, { useState } from 'react';
import { FormSchema, FieldType, FormField } from '../../types';
import { PlusIcon, TrashIcon, SparklesIcon, GripVerticalIcon, ArrowLeftIcon, CalendarIcon, ClockIcon, ListCheckIcon } from '../ui/Icons';
import { generateFormSchema } from '../../services/geminiService';

interface FormBuilderProps {
  initialData?: FormSchema | null;
  onSave: (form: FormSchema) => Promise<void>;
  onCancel: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultThankYou = {
  title: "¡Reserva Confirmada!",
  message: "Hola @Nombre, en un momento nos comunicaremos contigo para confirmar tu reserva.",
  redirectUrl: "",
  buttonText: "Ver mis reservas"
};

const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

export const FormBuilder: React.FC<FormBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // Form State
  const [title, setTitle] = useState(initialData?.title || 'Nuevo Formulario');
  const [description, setDescription] = useState(initialData?.description || '');
  const [fields, setFields] = useState<FormField[]>(initialData?.fields || []);
  const [thankYou, setThankYou] = useState(initialData?.thankYouScreen || defaultThankYou);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(initialData?.googleSheetUrl || DEFAULT_SHEET_URL);
  
  // Custom ID
  const [customId, setCustomId] = useState(initialData?.id || generateId());

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setLoadingAi(true);
    try {
      const schema = await generateFormSchema(aiPrompt);
      if (schema.title) setTitle(schema.title);
      if (schema.description) setDescription(schema.description);
      if (schema.fields) setFields(schema.fields as FormField[]);
      if (schema.thankYouScreen) setThankYou(schema.thankYouScreen);
      setShowAiModal(false);
    } catch (err: any) {
      alert(err.message || "Error generando el formulario.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: 'Nuevo Campo',
      required: false,
      options: (type === FieldType.SINGLE_SELECT || type === FieldType.CHECKBOX) ? ['Opción 1', 'Opción 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
      setFields(newFields);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("El título es obligatorio");
    const cleanId = customId.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    if (!cleanId) return alert("El ID personalizado no es válido.");

    setIsSaving(true);
    const newForm: FormSchema = {
      id: cleanId,
      title,
      description,
      fields,
      thankYouScreen: thankYou,
      isActive: initialData?.isActive ?? true,
      createdAt: initialData?.createdAt || Date.now(),
      googleSheetUrl: googleSheetUrl.trim()
    };
    await onSave(newForm);
    setIsSaving(false);
  };

  return (
    <div className="bg-dark-900 min-h-screen text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur border-b border-dark-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-dark-800 rounded-full text-dark-muted hover:text-white transition-colors">
            <ArrowLeftIcon />
          </button>
          <h2 className="text-xl font-bold">
            {initialData ? 'Editar Formulario' : 'Crear Formulario'}
          </h2>
        </div>
        <div className="flex gap-3">
           {!initialData && (
            <button 
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-eco-400 bg-eco-500/10 hover:bg-eco-500/20 rounded-lg font-medium transition-colors border border-eco-500/20"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Generar con IA</span>
            </button>
           )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-eco-500 text-dark-900 rounded-lg hover:bg-eco-400 font-bold disabled:opacity-70 disabled:cursor-wait flex items-center gap-2 shadow-glow"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5 shadow-card sticky top-28">
            <div className="flex gap-2 mb-6 border-b border-dark-700 pb-2">
              <button 
                onClick={() => setActiveTab('fields')}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'fields' ? 'text-eco-400 border-b-2 border-eco-500' : 'text-dark-muted hover:text-white'}`}
              >
                Campos
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-eco-400 border-b-2 border-eco-500' : 'text-dark-muted hover:text-white'}`}
              >
                Configuración
              </button>
            </div>

            {activeTab === 'fields' ? (
              <div className="grid grid-cols-1 gap-2">
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 tracking-wider mt-1">Texto & Números</p>
                <button onClick={() => handleAddField(FieldType.SHORT_TEXT)} className="field-btn">Texto Corto</button>
                <button onClick={() => handleAddField(FieldType.LONG_TEXT)} className="field-btn">Texto Largo</button>
                <button onClick={() => handleAddField(FieldType.NUMBER)} className="field-btn">Número</button>
                
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 mt-4 tracking-wider">Selección</p>
                <button onClick={() => handleAddField(FieldType.SINGLE_SELECT)} className="field-btn">Selección Única</button>
                <button onClick={() => handleAddField(FieldType.CHECKBOX)} className="field-btn flex items-center gap-2"><ListCheckIcon className="w-4 h-4 opacity-60" /> Casillas</button>

                <p className="text-xs text-dark-muted font-bold uppercase mb-2 mt-4 tracking-wider">Avanzado</p>
                <button onClick={() => handleAddField(FieldType.DATE)} className="field-btn flex items-center gap-2"><CalendarIcon className="w-4 h-4 opacity-60" /> Fecha</button>
                <button onClick={() => handleAddField(FieldType.TIME)} className="field-btn flex items-center gap-2"><ClockIcon className="w-4 h-4 opacity-60" /> Hora</button>
                <button onClick={() => handleAddField(FieldType.IMAGE_UPLOAD)} className="field-btn">Subir Imagen</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-dark-muted mb-1">ID Personalizado (URL)</label>
                    <div className="flex items-center">
                        <span className="bg-dark-900 border border-r-0 border-dark-600 rounded-l-lg px-3 py-2 text-xs text-dark-muted font-mono">?id=</span>
                        <input 
                            type="text" 
                            value={customId}
                            onChange={(e) => setCustomId(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 rounded-r-lg px-3 py-2 text-sm focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none text-white font-mono"
                        />
                    </div>
                </div>

                <div className="bg-dark-900/50 p-4 rounded-xl border border-dark-700">
                    <label className="block text-xs font-bold text-eco-400 mb-2 uppercase">Webhook Google Sheets</label>
                    <input 
                    type="url" 
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="w-full bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-xs focus:border-eco-500 outline-none text-dark-muted"
                    />
                </div>

                <div className="border-t border-dark-700 pt-4">
                    <label className="block text-sm font-medium text-dark-muted mb-1">Título Agradecimiento</label>
                    <input 
                        type="text" 
                        value={thankYou.title}
                        onChange={(e) => setThankYou({...thankYou, title: e.target.value})}
                        className="dark-input"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Mensaje</label>
                  <textarea 
                    value={thankYou.message}
                    onChange={(e) => setThankYou({...thankYou, message: e.target.value})}
                    rows={4}
                    className="dark-input"
                  />
                  <div className="mt-2 text-xs text-dark-muted">
                    Usa <span className="text-eco-400">@Etiqueta</span> para insertar respuestas.
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-muted mb-1">Botón</label>
                  <input 
                    type="text" 
                    value={thankYou.buttonText}
                    onChange={(e) => setThankYou({...thankYou, buttonText: e.target.value})}
                    className="dark-input"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-card">
             <input 
              type="text"
              placeholder="Título del Formulario"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold text-white w-full bg-transparent outline-none placeholder-dark-600 mb-2"
             />
             <input 
              type="text"
              placeholder="Descripción breve..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-dark-muted w-full bg-transparent outline-none placeholder-dark-600"
             />
          </div>

          <div className="space-y-4">
            {fields.length === 0 && (
              <div className="text-center py-16 bg-dark-800/50 rounded-2xl border border-dashed border-dark-700">
                <p className="text-dark-muted">Arrastra campos aquí o usa la IA para empezar.</p>
              </div>
            )}
            
            {fields.map((field, index) => (
              <div key={field.id} className="group bg-dark-800 border border-dark-700 rounded-2xl p-6 hover:border-eco-500/30 transition-all relative shadow-sm">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity bg-dark-800 border border-dark-700 rounded-lg p-1 shadow-lg z-10">
                  <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1.5 text-dark-muted hover:text-white disabled:opacity-30"><GripVerticalIcon className="w-4 h-4 rotate-90" /></button>
                  <button onClick={() => moveField(index, 'down')} disabled={index === fields.length-1} className="p-1.5 text-dark-muted hover:text-white disabled:opacity-30"><GripVerticalIcon className="w-4 h-4 -rotate-90" /></button>
                  <div className="w-px bg-dark-700 mx-1"></div>
                  <button onClick={() => removeField(field.id)} className="p-1.5 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="block text-[10px] uppercase text-dark-muted font-bold mb-1 tracking-wider">Etiqueta de Pregunta</label>
                      <input 
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full text-lg font-medium text-white bg-transparent border-b border-transparent hover:border-dark-600 focus:border-eco-500 outline-none transition-colors pb-1"
                        placeholder="Escribe la pregunta..."
                      />
                    </div>
                    <div className="w-32">
                       <label className="block text-[10px] uppercase text-dark-muted font-bold mb-1 tracking-wider">Tipo</label>
                       <div className="text-xs font-medium text-eco-400 py-1.5 px-3 bg-eco-500/10 rounded border border-eco-500/20 text-center">
                           {field.type.replace(/_/g, ' ')}
                       </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-6 items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded text-eco-500 focus:ring-eco-500 bg-dark-900 border-dark-600 w-4 h-4"
                      />
                      <span className="text-sm text-dark-muted group-hover:text-white transition-colors">Obligatorio</span>
                    </label>

                    {field.type === FieldType.NUMBER && (
                      <div className="flex gap-2 items-center text-sm">
                        <input 
                          type="number" 
                          placeholder="Min"
                          value={field.validation?.min || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, min: parseInt(e.target.value) || undefined } })}
                          className="w-16 bg-dark-900 border border-dark-600 rounded px-2 py-1 text-white text-xs"
                        />
                        <span className="text-dark-600">-</span>
                        <input 
                          type="number" 
                          placeholder="Max"
                          value={field.validation?.max || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, max: parseInt(e.target.value) || undefined } })}
                          className="w-16 bg-dark-900 border border-dark-600 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    )}

                    {(field.type === FieldType.SINGLE_SELECT || field.type === FieldType.CHECKBOX) && (
                      <div className="flex-1">
                        <input 
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:border-eco-500 outline-none"
                          placeholder="Opciones separadas por coma..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 shadow-2xl w-full max-w-lg p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-eco-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-eco-500/10 flex items-center justify-center text-eco-400">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Generador AI</h3>
            </div>
            
            {(!process.env.API_KEY || process.env.API_KEY.length < 10) && (
                <div className="mb-4 p-3 bg-red-900/20 text-red-400 text-sm rounded-lg border border-red-500/20">
                    <strong>Error:</strong> Falta API Key. <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline">Configurar</a>
                </div>
            )}

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-dark-900 border border-dark-700 rounded-xl p-4 mb-6 text-white focus:border-eco-500 outline-none resize-none h-32 placeholder-dark-600"
              placeholder="Ej: Formulario de satisfacción para hotel de lujo..."
            />
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-dark-muted hover:text-white hover:bg-dark-700 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAiGenerate}
                disabled={loadingAi || !aiPrompt.trim()}
                className="px-5 py-2 bg-eco-500 text-dark-900 rounded-lg hover:bg-eco-400 font-bold disabled:opacity-50 flex items-center gap-2 shadow-glow"
              >
                {loadingAi ? 'Creando...' : 'Generar'}
                {!loadingAi && <SparklesIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .field-btn {
            @apply text-left px-4 py-3 bg-dark-900/50 hover:bg-eco-500/10 hover:text-eco-400 text-dark-muted rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-eco-500/20 w-full;
        }
        .dark-input {
            @apply w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none transition-all;
        }
      `}</style>
    </div>
  );
};