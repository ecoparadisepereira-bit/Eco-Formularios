
import React, { useState, useRef } from 'react';
import { FormSchema, FieldType, FormField } from '../../types';
import { PlusIcon, TrashIcon, SparklesIcon, GripVerticalIcon, ArrowLeftIcon, CalendarIcon, ClockIcon, ListCheckIcon, UploadCloudIcon, ImageIcon, CheckIcon, TextIcon, HashIcon, ListIcon, TagIcon, DollarIcon, StarIcon, ClockIcon as NightIcon } from '../ui/Icons';

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

export const FormBuilder: React.FC<FormBuilderProps> = ({ initialData, onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'settings'>('fields');
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [title, setTitle] = useState(initialData?.title || 'Nuevo Formulario');
  const [description, setDescription] = useState(initialData?.description || '');
  const [fields, setFields] = useState<FormField[]>(initialData?.fields || []);
  const [thankYou, setThankYou] = useState(initialData?.thankYouScreen || defaultThankYou);
  const [googleSheetUrl, setGoogleSheetUrl] = useState(initialData?.googleSheetUrl || DEFAULT_SHEET_URL);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialData?.backgroundImageUrl || '');
  const [customId, setCustomId] = useState(initialData?.id || generateId());

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: type === FieldType.PAYMENT ? 'Abono / Pago Parcial' : 
             type === FieldType.DATE ? 'Fecha de Entrada' : 
             type === FieldType.ADDITIONAL_PERSON ? '¿Incluye Huésped Adicional?' : 
             type === FieldType.STAR_RATING ? 'Calificación del Servicio' : 'Nuevo Campo',
      required: false,
      productOptions: type === FieldType.PRODUCT ? [{ label: 'Habitación Estándar', price: 0, isPerNight: true }] : undefined,
      additionalPrice: type === FieldType.ADDITIONAL_PERSON ? 0 : undefined,
      isPerNight: type === FieldType.ADDITIONAL_PERSON ? true : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  // --- Lógica de Drag and Drop ---
  const onDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newFields = [...fields];
    const draggedItem = newFields[draggedIndex];
    
    // Intercambiar posición
    newFields.splice(draggedIndex, 1);
    newFields.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setFields(newFields);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
  };

  const addProductOption = (fieldId: string) => {
      setFields(fields.map(f => {
          if (f.id === fieldId && f.productOptions) {
              return { ...f, productOptions: [...f.productOptions, { label: 'Nuevo Item', price: 0, isPerNight: true }] };
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
      <div className="sticky top-0 z-30 bg-dark-900/90 backdrop-blur border-b border-dark-800 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-dark-800 rounded-full text-dark-muted hover:text-white transition-colors">
            <ArrowLeftIcon />
          </button>
          <h2 className="text-xl font-bold">{initialData ? 'Editar Formulario' : 'Crear Formulario'}</h2>
        </div>
        <div className="flex gap-3">
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
                <button onClick={() => handleAddField(FieldType.STAR_RATING)} className="field-btn"><StarIcon className="w-4 h-4 opacity-70" /> Calificación</button>
                
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 mt-4 tracking-wider ml-1">Comercial</p>
                <button onClick={() => handleAddField(FieldType.PRODUCT)} className="field-btn bg-eco-500/5 hover:bg-eco-500/10 border-eco-500/20"><TagIcon className="w-4 h-4 text-eco-400" /> Productos / Reservas</button>
                <button onClick={() => handleAddField(FieldType.ADDITIONAL_PERSON)} className="field-btn bg-eco-500/5 hover:bg-eco-500/10 border-eco-500/20"><PlusIcon className="w-4 h-4 text-eco-400" /> Huésped Adicional</button>
                <button onClick={() => handleAddField(FieldType.PAYMENT)} className="field-btn bg-eco-500/5 hover:bg-eco-500/10 border-eco-500/20"><DollarIcon className="w-4 h-4 text-eco-400" /> Abono / Pago</button>
                
                <p className="text-xs text-dark-muted font-bold uppercase mb-2 mt-4 tracking-wider ml-1">Otros</p>
                <button onClick={() => handleAddField(FieldType.LONG_TEXT)} className="field-btn"><TextIcon className="w-4 h-4 opacity-70" /> Texto Largo</button>
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
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6 pb-20">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 shadow-card">
             <input type="text" placeholder="Título del Formulario" value={title} onChange={(e) => setTitle(e.target.value)} className="text-3xl font-bold text-white w-full bg-transparent outline-none mb-2" />
             <input type="text" placeholder="Descripción..." value={description} onChange={(e) => setDescription(e.target.value)} className="text-dark-muted w-full bg-transparent outline-none" />
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={`group bg-dark-800 border transition-all duration-200 rounded-2xl p-6 relative cursor-default ${draggedIndex === index ? 'opacity-40 border-eco-500 scale-95 ring-2 ring-eco-500/20' : 'border-dark-700 hover:border-dark-600 hover:scale-[1.01]'}`}
              >
                {/* Drag Handle */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 text-dark-600 group-hover:text-dark-muted cursor-grab active:cursor-grabbing p-1">
                    <GripVerticalIcon className="w-5 h-5" />
                </div>

                <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex gap-2">
                  <button onClick={() => removeField(field.id)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                </div>

                <div className="pl-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <input value={field.label} onChange={(e) => updateField(field.id, { label: e.target.value })} className="flex-1 text-lg font-medium text-white bg-transparent border-b border-transparent hover:border-dark-600 focus:border-eco-500 outline-none pb-1 transition-all" />
                        <span className="text-[10px] font-bold text-dark-muted uppercase bg-dark-900 px-2 py-1 rounded border border-dark-700">{field.type.replace('_', ' ')}</span>
                    </div>
                    
                    {field.type === FieldType.PRODUCT && (
                        <div className="w-full bg-dark-900/50 p-4 rounded-xl border border-dark-700">
                             <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">Opciones de Producto / Habitaciones</label>
                                <button onClick={() => addProductOption(field.id)} className="text-xs text-eco-400 hover:text-white flex items-center gap-1"><PlusIcon className="w-3 h-3" /> Agregar Item</button>
                             </div>
                             <div className="space-y-3">
                                 {field.productOptions?.map((opt, idx) => (
                                     <div key={idx} className="flex gap-3 items-center animate-in slide-in-from-left-2 duration-200">
                                         <input type="text" value={opt.label} onChange={(e) => updateProductOption(field.id, idx, 'label', e.target.value)} placeholder="Ej: Suite King" className="flex-1 !bg-[#050505] border border-dark-600 rounded px-3 py-1.5 text-white text-sm" />
                                         <input type="number" value={opt.price} onChange={(e) => updateProductOption(field.id, idx, 'price', parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-24 !bg-[#050505] border border-dark-600 rounded px-3 py-1.5 text-white text-sm" />
                                         
                                         <button 
                                            onClick={() => updateProductOption(field.id, idx, 'isPerNight', !opt.isPerNight)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${opt.isPerNight ? 'bg-eco-500/10 border-eco-500 text-eco-400' : 'bg-dark-900 border-dark-600 text-dark-muted'}`}
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

                    {field.type === FieldType.ADDITIONAL_PERSON && (
                        <div className="flex gap-4 items-end bg-dark-900/50 p-4 rounded-xl border border-dark-700">
                             <div className="flex-1">
                                <label className="text-[10px] font-bold text-dark-muted uppercase tracking-wider mb-1 block">Precio por Adicional</label>
                                <input type="number" value={field.additionalPrice} onChange={(e) => updateField(field.id, { additionalPrice: parseFloat(e.target.value) || 0 })} className="w-full !bg-[#050505] border border-dark-600 rounded px-3 py-2 text-white text-sm" />
                             </div>
                             <button 
                                onClick={() => updateField(field.id, { isPerNight: !field.isPerNight })}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold transition-all border h-[38px] ${field.isPerNight ? 'bg-eco-500/10 border-eco-500 text-eco-400' : 'bg-dark-900 border-dark-600 text-dark-muted'}`}
                             >
                                <NightIcon className="w-3 h-3" />
                                X NOCHE
                             </button>
                        </div>
                    )}

                    {field.type === FieldType.STAR_RATING && (
                        <div className="flex items-center gap-3 bg-dark-900/40 p-4 rounded-xl border border-dashed border-dark-700">
                             <div className="flex gap-1 text-eco-500/30">
                                {[1,2,3,4,5].map(i => <StarIcon key={i} filled className="w-6 h-6" />)}
                             </div>
                             <p className="text-xs text-dark-muted italic">Previsualización del campo de calificación (1-5 estrellas)</p>
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
        .field-btn:hover { background: #1f2937; color: white; border-color: rgba(74, 222, 128, 0.3); transform: translateX(4px); }
      `}</style>
    </div>
  );
};
