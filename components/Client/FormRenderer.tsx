import React, { useState } from 'react';
import { FormSchema, FieldType, FormResponse } from '../../types';
import { ArrowLeftIcon, CheckIcon, DownloadIcon } from '../ui/Icons';
import { storageService } from '../../services/storageService';

interface FormRendererProps {
  form: FormSchema;
  onBack?: () => void;
}

const SYSTEM_DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

// Imagen de fondo por defecto (Hotel Nocturno/Piscina Luxury)
const HOTEL_BG_IMAGE = "https://images.unsplash.com/photo-1571896349842-6e53ce41e86c?q=80&w=2071&auto=format&fit=crop";

export const FormRenderer: React.FC<FormRendererProps> = ({ form, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bgImage = form.backgroundImageUrl && form.backgroundImageUrl.length > 5 ? form.backgroundImageUrl : HOTEL_BG_IMAGE;

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const handleCheckboxChange = (fieldId: string, option: string, isChecked: boolean) => {
      setAnswers(prev => {
          const currentValues = (prev[fieldId] as string[]) || [];
          let newValues = [];
          if (isChecked) {
              newValues = [...currentValues, option];
          } else {
              newValues = currentValues.filter(v => v !== option);
          }
          return { ...prev, [fieldId]: newValues };
      });
      if (errors[fieldId]) {
        const newErrors = { ...errors };
        delete newErrors[fieldId];
        setErrors(newErrors);
      }
  };

  const handleFileChange = async (fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        setErrors(prev => ({ ...prev, [fieldId]: 'El archivo no puede superar los 2MB.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange(fieldId, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    form.fields.forEach(field => {
      const val = answers[field.id];
      if (field.required) {
          if (field.type === FieldType.CHECKBOX) {
              if (!val || val.length === 0) newErrors[field.id] = 'Selecciona al menos una opción.';
          } else {
              if (!val) newErrors[field.id] = 'Este campo es obligatorio.';
          }
      }
      
      if (field.type === FieldType.NUMBER && val) {
        const numVal = Number(val);
        if (field.validation?.min !== undefined && numVal < field.validation.min) {
            newErrors[field.id] = `El valor mínimo es ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && numVal > field.validation.max) {
            newErrors[field.id] = `El valor máximo es ${field.validation.max}`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const cleanData: Record<string, any> = {
        formId: form.id, 
        formTitle: form.title
    };
    
    form.fields.forEach(f => {
        let val = answers[f.id];
        if (Array.isArray(val)) {
            val = val.join(', ');
        }
        cleanData[f.label] = val || ""; 
    });

    try {
        const targetUrl = form.googleSheetUrl || SYSTEM_DEFAULT_SHEET_URL;

        if (targetUrl) {
            await fetch(targetUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: JSON.stringify(cleanData)
            });
        }
        
        setIsSubmitted(true);
    } catch (error) {
        console.error("Submission error", error);
        setIsSubmitted(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  const getInterpolatedMessage = () => {
    let message = form.thankYouScreen.message;
    form.fields.forEach(field => {
        let answer = answers[field.id];
        if (Array.isArray(answer)) answer = answer.join(', ');
        const displayValue = answer !== undefined && answer !== null ? String(answer) : '';
        const regex = new RegExp(`@${field.label}`, 'gi');
        message = message.replace(regex, `<span class="font-bold text-eco-400 border-b border-eco-500/30 pb-0.5">${displayValue}</span>`);
    });
    return message.replace(/\n/g, '<br/>');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-eco-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="bg-dark-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-dark-800 max-w-md w-full overflow-hidden relative z-10">
          <div className="h-1 bg-gradient-to-r from-eco-600 to-eco-400 w-full"></div>

          <div className="p-8 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-eco-500/20 rounded-full animate-pulse"></div>
                <div className="relative bg-eco-500/10 border border-eco-500/30 rounded-full w-24 h-24 flex items-center justify-center shadow-glow">
                    <CheckIcon className="w-10 h-10 text-eco-400" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{form.thankYouScreen.title}</h2>
            
            <div className="text-dark-muted mb-8 font-medium text-sm">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            <div className="bg-dark-800/50 rounded-xl p-6 mb-8 border border-dark-700 text-left relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-eco-500"></div>
                <div 
                    className="text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: getInterpolatedMessage() }} 
                />
            </div>

            <div className="flex flex-col gap-3">
             {form.thankYouScreen.redirectUrl && (
                <a href={form.thankYouScreen.redirectUrl} className="w-full py-3.5 bg-eco-600 text-white rounded-xl font-bold hover:bg-eco-500 transition-colors shadow-lg shadow-eco-900/20">
                    Ir al enlace
                </a>
             )}
             {onBack && (
                 <button 
                    onClick={onBack}
                    className="w-full py-3.5 bg-transparent border border-dark-700 text-dark-muted hover:text-white rounded-xl font-medium hover:bg-dark-800 transition-colors"
                 >
                    {form.thankYouScreen.buttonText || "Volver"}
                 </button>
             )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-eco-500/30">
      
      {/* Hero Image Section */}
      <div className="relative h-80 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-950/60 to-dark-950 z-10"></div>
          <img 
            src={bgImage} 
            alt="Hotel Background" 
            className="w-full h-full object-cover opacity-80"
          />
          {onBack && (
            <button 
                onClick={onBack} 
                className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-dark-900/50 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium hover:bg-dark-900 transition-colors border border-white/10"
            >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Volver</span>
            </button>
          )}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-20 -mt-24 relative z-20">
        <div className="bg-dark-900/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-dark-800 overflow-hidden">
          {/* Header Strip */}
          <div className="h-1 w-full bg-gradient-to-r from-eco-600 via-eco-400 to-eco-600"></div>
          
          <div className="px-8 py-10">
            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{form.title}</h1>
                <p className="text-dark-muted text-lg leading-relaxed">{form.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {form.fields.map(field => (
                <div key={field.id} className="space-y-3 group">
                  <label className="block text-sm font-bold text-gray-300 group-hover:text-eco-400 transition-colors uppercase tracking-wide text-xs">
                    {field.label} {field.required && <span className="text-eco-500">*</span>}
                  </label>
                  
                  {field.type === FieldType.SHORT_TEXT && (
                    <input 
                      type="text" 
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3.5 bg-dark-900/80 border ${errors[field.id] ? 'border-red-500/50' : 'border-dark-700 focus:border-eco-500'} rounded-xl text-white outline-none transition-all placeholder-dark-600 focus:bg-dark-800 focus:shadow-[0_0_15px_rgba(34,197,94,0.1)]`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.LONG_TEXT && (
                    <textarea 
                      rows={4}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3.5 bg-dark-900/80 border ${errors[field.id] ? 'border-red-500/50' : 'border-dark-700 focus:border-eco-500'} rounded-xl text-white outline-none transition-all placeholder-dark-600 focus:bg-dark-800 focus:shadow-[0_0_15px_rgba(34,197,94,0.1)]`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.NUMBER && (
                    <input 
                      type="number"
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3.5 bg-dark-900/80 border ${errors[field.id] ? 'border-red-500/50' : 'border-dark-700 focus:border-eco-500'} rounded-xl text-white outline-none transition-all placeholder-dark-600 focus:bg-dark-800 focus:shadow-[0_0_15px_rgba(34,197,94,0.1)]`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.DATE && (
                    <input 
                      type="date"
                      className={`w-full px-4 py-3.5 bg-dark-900/80 border ${errors[field.id] ? 'border-red-500/50' : 'border-dark-700 focus:border-eco-500'} rounded-xl text-white outline-none transition-all placeholder-dark-600 focus:bg-dark-800 [color-scheme:dark]`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.TIME && (
                    <input 
                      type="time"
                      className={`w-full px-4 py-3.5 bg-dark-900/80 border ${errors[field.id] ? 'border-red-500/50' : 'border-dark-700 focus:border-eco-500'} rounded-xl text-white outline-none transition-all placeholder-dark-600 focus:bg-dark-800 [color-scheme:dark]`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.SINGLE_SELECT && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {field.options?.map(opt => (
                        <label key={opt} className="relative flex items-center p-4 border border-dark-700 rounded-xl hover:bg-dark-800 hover:border-eco-500/30 cursor-pointer transition-all group/opt bg-dark-900/50">
                          <input 
                            type="radio" 
                            name={field.id} 
                            value={opt}
                            className="peer h-4 w-4 text-eco-500 focus:ring-eco-500 bg-dark-900 border-dark-600"
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                          />
                          <span className="ml-3 text-dark-muted font-medium peer-checked:text-white transition-colors">{opt}</span>
                          <div className="absolute inset-0 border-2 border-transparent peer-checked:border-eco-500 rounded-xl pointer-events-none"></div>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === FieldType.CHECKBOX && (
                    <div className="space-y-3">
                      {field.options?.map(opt => (
                        <label key={opt} className="flex items-center p-4 border border-dark-700 rounded-xl hover:bg-dark-800 cursor-pointer transition-all bg-dark-900/50">
                          <input 
                            type="checkbox" 
                            name={field.id} 
                            value={opt}
                            className="h-5 w-5 text-eco-500 bg-dark-900 border-dark-600 rounded focus:ring-eco-500 focus:ring-offset-dark-900"
                            onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                          />
                          <span className="ml-3 text-gray-300 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === FieldType.IMAGE_UPLOAD && (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dark-700 border-dashed rounded-xl hover:bg-dark-800/50 hover:border-eco-500/50 transition-colors bg-dark-800/20">
                      <div className="space-y-2 text-center">
                        <svg className="mx-auto h-12 w-12 text-dark-600" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-dark-muted justify-center">
                          <label htmlFor={field.id} className="relative cursor-pointer rounded-md font-bold text-eco-400 hover:text-eco-300 focus-within:outline-none hover:underline">
                            <span>Subir archivo</span>
                            <input id={field.id} name={field.id} type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(field.id, e)} />
                          </label>
                        </div>
                        <p className="text-xs text-dark-600">PNG, JPG hasta 2MB</p>
                        {answers[field.id] && (
                            <div className="flex items-center justify-center gap-2 mt-2 text-eco-400 text-xs font-bold bg-eco-500/10 py-1 px-3 rounded-full">
                                <CheckIcon className="w-3 h-3" />
                                Imagen lista
                            </div>
                        )}
                      </div>
                    </div>
                  )}

                  {errors[field.id] && (
                    <p className="text-sm text-red-400 font-medium mt-1 ml-1 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-red-400 inline-block"></span>
                        {errors[field.id]}
                    </p>
                  )}
                </div>
              ))}

              <div className="pt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-4 px-6 border border-transparent shadow-[0_0_20px_rgba(34,197,94,0.2)] text-lg font-bold rounded-xl text-dark-900 bg-gradient-to-r from-eco-600 to-eco-400 hover:from-eco-500 hover:to-eco-300 focus:outline-none transform transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)] disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="text-center mt-8 text-dark-600 text-xs font-medium uppercase tracking-widest opacity-50">
            Powered by Ecoparadise
        </div>
      </div>
    </div>
  );
};