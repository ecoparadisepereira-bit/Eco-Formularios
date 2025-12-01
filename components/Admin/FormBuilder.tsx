import React, { useState, useEffect } from 'react';
import { FormSchema, FieldType, FormField } from '../../types';
import { PlusIcon, TrashIcon, SparklesIcon, GripVerticalIcon, ArrowLeftIcon } from '../ui/Icons';
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
      options: type === FieldType.SINGLE_SELECT ? ['Opción 1', 'Opción 2'] : undefined,
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
    setIsSaving(true);
    const newForm: FormSchema = {
      id: initialData?.id || generateId(),
      title,
      description,
      fields,
      thankYouScreen: thankYou,
      isActive: initialData?.isActive ?? true,
      createdAt: initialData?.createdAt || Date.now(),
      googleSheetUrl: googleSheetUrl.trim()
    };
    await onSave(newForm);
    // Note: onSave in App.tsx switches view, so we don't need to unset isSaving typically, but safe to do so.
    setIsSaving(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b px-6 py-4 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
            <ArrowLeftIcon />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'Editar Formulario' : 'Crear Formulario'}
          </h2>
        </div>
        <div className="flex gap-2">
           {!initialData && (
            <button 
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg font-medium transition-colors"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Generar con IA</span>
            </button>
           )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[#043200] text-white rounded-lg hover:bg-[#064e00] font-medium disabled:opacity-70 disabled:cursor-wait flex items-center gap-2"
          >
            {isSaving ? (
                <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Guardando...
                </>
            ) : "Guardar"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border p-4 shadow-sm sticky top-24">
            <div className="flex gap-2 mb-6 border-b pb-2">
              <button 
                onClick={() => setActiveTab('fields')}
                className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'fields' ? 'text-green-800 border-b-2 border-[#043200]' : 'text-gray-500'}`}
              >
                Campos
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 pb-2 text-sm font-medium ${activeTab === 'settings' ? 'text-green-800 border-b-2 border-[#043200]' : 'text-gray-500'}`}
              >
                Configuración
              </button>
            </div>

            {activeTab === 'fields' ? (
              <div className="grid grid-cols-1 gap-2">
                <p className="text-xs text-gray-400 font-medium uppercase mb-2 tracking-wider">Añadir Campo</p>
                <button onClick={() => handleAddField(FieldType.SHORT_TEXT)} className="text-left px-4 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-green-200">Texto Corto</button>
                <button onClick={() => handleAddField(FieldType.LONG_TEXT)} className="text-left px-4 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-green-200">Texto Largo (Párrafo)</button>
                <button onClick={() => handleAddField(FieldType.NUMBER)} className="text-left px-4 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-green-200">Número</button>
                <button onClick={() => handleAddField(FieldType.SINGLE_SELECT)} className="text-left px-4 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-green-200">Selección Única</button>
                <button onClick={() => handleAddField(FieldType.IMAGE_UPLOAD)} className="text-left px-4 py-3 bg-gray-50 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-green-200">Subida de Imagen</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <label className="block text-xs font-bold text-green-800 mb-1 uppercase">Conexión Google Sheets</label>
                    <p className="text-xs text-green-700 mb-2">URL del Script de Google Apps (Base de Datos):</p>
                    <input 
                    type="url" 
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-500"
                    readOnly
                    />
                    <p className="text-[10px] text-green-600 mt-2 font-medium">
                      * Configurado por defecto para Ecoparadise.
                    </p>
                </div>

                <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título Agradecimiento</label>
                    <input 
                        type="text" 
                        value={thankYou.title}
                        onChange={(e) => setThankYou({...thankYou, title: e.target.value})}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje de Confirmación</label>
                  <textarea 
                    value={thankYou.message}
                    onChange={(e) => setThankYou({...thankYou, message: e.target.value})}
                    rows={4}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                  />
                  
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-100 rounded text-xs">
                    <span className="font-semibold text-gray-600 block mb-1">Variables Disponibles:</span>
                    <div className="flex flex-wrap gap-1">
                        {fields.map(f => (
                            <span key={f.id} className="inline-block px-1.5 py-0.5 bg-green-100 text-green-800 rounded border border-green-200">
                                @{f.label}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto del Botón</label>
                  <input 
                    type="text" 
                    value={thankYou.buttonText}
                    onChange={(e) => setThankYou({...thankYou, buttonText: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redireccionar URL (Opcional)</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={thankYou.redirectUrl}
                    onChange={(e) => setThankYou({...thankYou, redirectUrl: e.target.value})}
                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-green-700 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
             <input 
              type="text"
              placeholder="Título del Formulario"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-3xl font-bold text-gray-800 w-full outline-none placeholder-gray-300 mb-2"
             />
             <input 
              type="text"
              placeholder="Descripción breve..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-gray-500 w-full outline-none placeholder-gray-300"
             />
          </div>

          <div className="space-y-4">
            {fields.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-400">Añade campos desde el menú izquierdo o usa la IA para empezar.</p>
              </div>
            )}
            {fields.map((field, index) => (
              <div key={field.id} className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow relative">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                  <button onClick={() => moveField(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><GripVerticalIcon className="w-4 h-4 rotate-90" /></button>
                  <button onClick={() => moveField(index, 'down')} disabled={index === fields.length-1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><GripVerticalIcon className="w-4 h-4 -rotate-90" /></button>
                  <button onClick={() => removeField(field.id)} className="p-1 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs uppercase text-gray-400 font-bold mb-1 tracking-wider">Etiqueta</label>
                      <input 
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        className="w-full text-lg font-medium text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none transition-colors"
                        placeholder="Pregunta del campo..."
                      />
                    </div>
                    <div className="w-32">
                       <label className="block text-xs uppercase text-gray-400 font-bold mb-1 tracking-wider">Tipo</label>
                       <div className="text-sm font-medium text-gray-600 py-1 bg-gray-100 rounded px-2">{field.type.replace('_', ' ')}</div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        className="rounded text-green-700 focus:ring-green-600 w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">Obligatorio</span>
                    </label>

                    {field.type === FieldType.NUMBER && (
                      <div className="flex gap-2 items-center text-sm">
                        <input 
                          type="number" 
                          placeholder="Min"
                          value={field.validation?.min || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, min: parseInt(e.target.value) || undefined } })}
                          className="w-16 border rounded px-2 py-1"
                        />
                        <span className="text-gray-400">-</span>
                        <input 
                          type="number" 
                          placeholder="Max"
                          value={field.validation?.max || ''}
                          onChange={(e) => updateField(field.id, { validation: { ...field.validation, max: parseInt(e.target.value) || undefined } })}
                          className="w-16 border rounded px-2 py-1"
                        />
                      </div>
                    )}

                    {field.type === FieldType.SINGLE_SELECT && (
                      <div className="w-full mt-2 bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Opciones (separadas por coma)</p>
                        <input 
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full border rounded px-3 py-2 text-sm"
                          placeholder="Opción 1, Opción 2, Opción 3"
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

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center gap-3 mb-4 text-[#043200]">
              <SparklesIcon className="w-6 h-6" />
              <h3 className="text-xl font-bold text-gray-900">Generador Mágico AI</h3>
            </div>
            
            {(!process.env.API_KEY || process.env.API_KEY.length < 10) && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    <strong>Error de Configuración:</strong> Falta la API Key de Gemini en Vercel. 
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" className="underline ml-1 font-bold">Consíguela aquí</a>
                </div>
            )}

            <p className="text-gray-600 mb-4">
              Describe el formulario que necesitas.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-4 mb-4 text-gray-800 focus:ring-2 focus:ring-[#043200] outline-none resize-none h-32"
              placeholder="Describe tu formulario aquí..."
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAiGenerate}
                disabled={loadingAi || !aiPrompt.trim()}
                className="px-4 py-2 bg-[#043200] text-white rounded-lg hover:bg-[#064e00] font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loadingAi ? 'Generando...' : 'Crear Formulario'}
                {!loadingAi && <SparklesIcon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};