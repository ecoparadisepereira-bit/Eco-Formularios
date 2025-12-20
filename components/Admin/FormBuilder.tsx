
import React, { useState, useRef } from 'react';
import { FormSchema, FieldType, FormField } from '../../types';
import { PlusIcon, TrashIcon, SparklesIcon, GripVerticalIcon, ArrowLeftIcon, CalendarIcon, ClockIcon, ListCheckIcon, UploadCloudIcon, ImageIcon, CheckIcon, TextIcon, HashIcon, ListIcon, TagIcon, DollarIcon, ClockIcon as NightIcon } from '../ui/Icons';
import { generateFormSchema } from '../../services/geminiService';

interface FormBuilderProps {
  initialData?: FormSchema | null;
  onSave: (form: FormSchema) => Promise<void>;
  onCancel: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultThankYou = {
  title: "¡Reserva Confirmada!",
  message: "Hola @Nombre, el total de tu reserva es @Total. Has abonado @Abono y queda pendiente @Pendiente. Nos comunicaremos contigo pronto.",
  redirectUrl: "",
  buttonText: "Ver mis reservas"
};

const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

const PRESET_IMAGES = [
  { name: 'Hotel Luxury', url: 'https://images.unsplash.com/photo-1571896349842-6e53ce41e86c?q=80&w=2071&auto=format&fit=crop' },
  { name: 'Naturaleza Eco', url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Oscuro Abstracto', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Minimal Verde', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop' }
];

export const FormBuilder: React.FC<FormBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields');
  const [loadingAi, setLoadingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || 'Nuevo Formulario');
  const [description, setDescription] = useState(initialData?.description || '');
  const [fields, setFields] = useState<FormField[]>(initialData?.fields || []);
  const [thankYou, setThankYou] = useState(initialData?.thankYouScreen || defaultThankYou);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(initialData?.googleSheetUrl || DEFAULT_SHEET_URL);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialData?.backgroundImageUrl || '');
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
      label: type === FieldType.PAYMENT ? 'Abono / Pago Parcial' : 'Nuevo Campo',
      required: false,
      options: (type === FieldType.SINGLE_SELECT || type === FieldType.CHECKBOX) ? ['Opción 1', 'Opción 2'] : undefined,
      productOptions: type === FieldType.PRODUCT ? [{ label: 'Habitación Estándar', price: 0, isPerNight: true }] : undefined,
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

  const addProductOption = (fieldId: string) => {
      setFields(fields.map(f => {
          if (f.id === fieldId && f.productOptions) {
              return { ...f, productOptions: [...f.productOptions, { label: 'Nuevo Item', price: 0, isPerNight: false }] };
          }
          return f;
      }));
  };

  const updateProductOption = (fieldId: string, index: number, key: 'label' | 'price' | 'isPerNight', value: any) => {
      setFields(fields.map(f => {
          if (f.id === fieldId && f.productOptions) {
              const newOpts = [...f.productOptions];
              newOpts[index] = { ...newOpts[index], [key]: value };
              return { ...f, productOptions: newOpts };
          }
          return f;
      }));
  };

  const removeProductOption = (fieldId: string, index: number) => {
      setFields(fields.map(f => {
          if (f.id === fieldId && f.productOptions) {
              const newOpts = f.productOptions.filter((_, i) => i !== index);
              return { ...f, productOptions: newOpts };
          }
          return f;
      }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert("La imagen es demasiado pesada.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                setBackgroundImageUrl(dataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return alert("El título es obligatorio");
    setIsSaving(true);
    const newForm: FormSchema = {
      id: customId.trim().replace(/[^a-zA-Z0-9-_]/g, ''),
      title,
      description,
      fields,
      thankYouScreen: thankYou,
      isActive: initialData?.isActive ?? true,
      createdAt: initialData?.createdAt || Date.now(),
      googleSheetUrl: googleSheetUrl.trim(),
      backgroundImageUrl: backgroundImageUrl.trim()
    };
    await onSave(newForm);
    setIsSaving(false);
  };

  const inputClass = "w-full !bg-[#050505] border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:border-eco-500 focus:ring-1 focus:ring-eco-500 outline-none transition-all placeholder-dark-600";

  return (
    <div className="bg-dark-900 min-h-screen text-white">
      <div className="sticky top-0 z-20 bg-dark-900/90 backdrop-blur border-b border-dark-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-dark-800 rounded-full text-dark-muted hover:text-white transition-colors">
            <ArrowLeftIcon />
          </button>
          <h2 className="text-xl font-bold">{initialData ? 'Editar Formulario' : 'Crear Formulario'}</h2>
        </div>
        <div className="flex gap-3">
           {!initialData && (
            <button onClick={() => setShowAiModal(true)} className="flex items-center gap-2 px-4 py-2 text-eco-400 bg-eco-500/10 hover:bg-eco-500/20 rounded-lg font-medium transition-colors border border-eco-500/20">
              <SparklesIcon className="w-4 h-4" />
              <span>Generar con IA</span>
            </button>
           )}
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-eco-500 text-dark-900 rounded-lg hover:bg-eco-400 font-bold disabled:opacity-70 disabled:cursor-wait flex items-center gap-2 shadow-glow">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-5 shadow-card sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto">
            <div className="flex gap-2 mb-6 border-b border-dark-700 pb-2">
              <button onClick={() => setActiveTab('fields')} className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'fields' ? 'text-eco-400 border-b-2 border-eco-500' : 'text-dark-muted hover:text-white'}`}>Campos</button>
              <button onClick={() => setActiveTab('settings')} className={`flex-1 pb-2 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-eco-400 border-b-2 border-eco-500' : 'text-dark-muted hover:text-white'}`}>Configuración</button>
            </div>

            {activeTab === 'fields' ? (
              <div className="grid grid-cols-1 gap-2">
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 tracking-wider mt-1 ml-1">Básicos</p>
                <button onClick={() => handleAddField(FieldType.SHORT_TEXT)} className="field-btn"><TextIcon className="w-4 h-4 opacity-70" /> Texto Corto</button>
                <button onClick={() => handleAddField(FieldType.NUMBER)} className="field-btn"><HashIcon className="w-4 h-4 opacity-70" /> Número</button>
                <button onClick={() => handleAddField(FieldType.DATE)} className="field-btn"><CalendarIcon className="w-4 h-4 opacity-70" /> Fecha</button>
                
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 mt-4 tracking-wider ml-1">Comercial</p>
                <button onClick={() => handleAddField(FieldType.PRODUCT)} className="field-btn bg-eco-500/5 hover:bg-eco-500/10 border-eco-500/20"><TagIcon className="w-4 h-4 text-eco-400" /> Productos / Reservas</button>
                <button onClick={() => handleAddField(FieldType.PAYMENT)} className="field-btn bg-eco-500/5 hover:bg-eco-500/10 border-eco-500/20"><DollarIcon className="w-4 h-4 text-eco-400" /> Abono / Pago</button>
                
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 mt-4 tracking-wider ml-1">Otros</p>
                <button onClick={() => handleAddField(FieldType.LONG_TEXT)} className="field-btn"><TextIcon className="w-4 h-4 opacity-70" /> Texto Largo</button>
                <button onClick={() => handleAddField(FieldType.SINGLE_SELECT)} className="field-btn"><ListIcon className="w-4 h-4 opacity-70" /> Selección Única</button>
                <button onClick={() => handleAddField(FieldType.IMAGE_UPLOAD)} className="field-btn"><ImageIcon className="w-4 h-4 opacity-70" /> Subir Imagen</button>
              </div>
            ) : (
              <div className="space-y-8 pr-1">
                <section>
                    <h3 className="text-[10px] font-bold text-eco-400 uppercase tracking-widest mb-3 border-b border-dark-700 pb-2">Identidad</h3>
                    <div>
                        <label className="block text-xs font-medium text-dark-muted mb-1.5">ID Personalizado (URL)</label>
                        <input type="text" value={customId} onChange={(e) => setCustomId(e.target.value)} className={inputClass} />
                    </div>
                </section>
                <section>
                    <h3 className="text-[10px] font-bold text-eco-400 uppercase tracking-widest mb-3 border-b border-dark-700 pb-2">Integraciones</h3>
                    <input type="url" value={googleSheetUrl} onChange={(e) => setGoogleSheetUrl(e.target.value)} className={inputClass} placeholder="Google Sheet Webhook..." />
                </section>
                <section>
                    <h3 className="text-[10px] font-bold text-eco-400 uppercase tracking-widest mb-3 border-b border-dark-700 pb-2">Pantalla Final</h3>
                    <textarea value={thankYou.message} onChange={(e) => setThankYou({...thankYou, message: e.target.value})} rows={4} className={inputClass} />
                </section>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-card">
             <input type="text" placeholder="Título del Formulario" value={title} onChange={(e) => setTitle(e.target.value)} className="text-3xl font-bold text-white w-full bg-transparent outline-none mb-2" />
             <input type="text" placeholder="Descripción..." value={description} onChange={(e) => setDescription(e.target.value)} className="text-dark-muted w-full bg-transparent outline-none" />
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="group bg-dark-800 border border-dark-700 rounded-2xl p-6 relative">
                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex gap-2">
                  <button onClick={() => removeField(field.id)} className="p-1.5 text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4">
                    <input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="w-full text-lg font-medium text-white bg-transparent border-b border-transparent hover:border-dark-600 focus:border-eco-500 outline-none pb-1" />
                    
                    {field.type === FieldType.PRODUCT && (
                        <div className="w-full bg-dark-900/50 p-4 rounded-xl border border-dark-700">
                             <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Opciones de Producto / Habitaciones</label>
                                <button onClick={() => addProductOption(field.id)} className="text-xs text-eco-400 hover:text-white flex items-center gap-1"><PlusIcon className="w-3 h-3" /> Agregar Item</button>
                             </div>
                             <div className="space-y-3">
                                 {field.productOptions?.map((opt, idx) => (
                                     <div key={idx} className="flex gap-3 items-center">
                                         <input type="text" value={opt.label} onChange={(e) => updateProductOption(field.id, idx, 'label', e.target.value)} placeholder="Ej: Suite King" className="flex-1 !bg-[#050505] border border-dark-600 rounded px-3 py-1.5 text-white text-sm" />
                                         <input type="number" value={opt.price} onChange={(e) => updateProductOption(field.id, idx, 'price', parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-24 !bg-[#050505] border border-dark-600 rounded px-3 py-1.5 text-white text-sm" />
                                         
                                         <button 
                                            onClick={() => updateProductOption(field.id, idx, 'isPerNight', !opt.isPerNight)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${opt.isPerNight ? 'bg-eco-500/10 border-eco-500 text-eco-400' : 'bg-dark-900 border-dark-600 text-dark-muted'}`}
                                            title="Si está activo, multiplicará el precio por el número de noches"
                                         >
                                            <NightIcon className="w-3 h-3" />
                                            X NOCHE
                                         </button>

                                         <button onClick={() => removeProductOption(field.id, idx)} className="p-1.5 text-dark-600 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .field-btn {
            display: flex; align-items: center; gap: 0.75rem; width: 100%; text-align: left; padding: 0.75rem 1rem; background: rgba(31, 41, 55, 0.5); border: 1px solid #1f2937; border-radius: 0.75rem; font-size: 0.875rem; color: #94a3b8; transition: all 0.2s;
        }
        .field-btn:hover { background: #1f2937; color: white; border-color: rgba(74, 222, 128, 0.3); }
      `}</style>
    </div>
  );
};
