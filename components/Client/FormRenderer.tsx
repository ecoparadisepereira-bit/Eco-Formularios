import React, { useState } from 'react';
import { FormSchema, FieldType, FormResponse } from '../../types';
import { ArrowLeftIcon, CheckIcon, DownloadIcon } from '../ui/Icons';
import { storageService } from '../../services/storageService';

interface FormRendererProps {
  form: FormSchema;
  onBack?: () => void; // Optional now, since public link has nowhere to go back to
}

// URL DE RESPALDO: Si el formulario no trae URL, se usa esta obligatoriamente.
const SYSTEM_DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";

export const FormRenderer: React.FC<FormRendererProps> = ({ form, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    // Clear error on change
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
      if (field.required && !answers[field.id]) {
        newErrors[field.id] = 'Este campo es obligatorio.';
      }
      if (field.type === FieldType.NUMBER && answers[field.id]) {
        const val = Number(answers[field.id]);
        if (field.validation?.min !== undefined && val < field.validation.min) {
            newErrors[field.id] = `El valor mínimo es ${field.validation.min}`;
        }
        if (field.validation?.max !== undefined && val > field.validation.max) {
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

    const responseData = {
        ...answers,
        formTitle: form.title
    };

    // Replace Field IDs with readable labels for Google Sheets
    const cleanData: Record<string, any> = {};
    form.fields.forEach(f => {
        // If the answer exists, map it to the Label. If not, empty string.
        cleanData[f.label] = answers[f.id] || ""; 
    });

    try {
        // 1. Save Locally (Backup)
        const localResponse: FormResponse = {
            id: Math.random().toString(36).substr(2, 9),
            formId: form.id,
            answers,
            submittedAt: Date.now()
        };
        storageService.saveResponse(localResponse);

        // 2. Send to Google Sheets
        // Prioridad: URL específica del form > URL del sistema por defecto
        const targetUrl = form.googleSheetUrl || SYSTEM_DEFAULT_SHEET_URL;

        if (targetUrl) {
            await fetch(targetUrl, {
                method: 'POST',
                mode: 'no-cors', // Important for Google Apps Script
                headers: {
                    'Content-Type': 'text/plain', // 'text/plain' ensures no preflight OPTIONS check
                },
                body: JSON.stringify(cleanData)
            });
        }
        
        setIsSubmitted(true);
    } catch (error) {
        console.error("Submission error", error);
        // Even if fetch fails (network), we show success if local save worked, 
        // but user expects cloud save.
        // For GAS 'no-cors', we can't really catch specific script errors, 
        // so we assume success if the network request went out.
        setIsSubmitted(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  // Helper to interpolate variables in the Thank You message
  const getInterpolatedMessage = () => {
    let message = form.thankYouScreen.message;
    
    // Iterate over fields and replace @Label with the actual answer
    form.fields.forEach(field => {
        const answer = answers[field.id];
        const displayValue = answer !== undefined && answer !== null ? String(answer) : '';
        // Escape label for regex just in case, though basic labels are usually safe
        // We handle simple replacement of @Label
        const regex = new RegExp(`@${field.label}`, 'gi');
        message = message.replace(regex, `<span class="font-semibold text-gray-900">${displayValue}</span>`);
    });
    
    return message.replace(/\n/g, '<br/>');
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {/* Card Container simulating a Receipt/Booking Confirmation */}
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative">
          
          {/* Top Decorative Strip */}
          <div className="h-3 bg-[#043200] w-full"></div>

          <div className="p-8 text-center">
            {/* Success Icon with Pulse Effect */}
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-green-100 rounded-full w-20 h-20 flex items-center justify-center">
                    <CheckIcon className="w-10 h-10 text-green-700" />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">{form.thankYouScreen.title}</h2>
            
            <div className="text-gray-500 mb-8 font-medium">
               {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Receipt Content Box */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100 text-left">
                <div 
                    className="text-gray-600 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: getInterpolatedMessage() }} 
                />
            </div>

            <div className="flex flex-col gap-3">
             {form.thankYouScreen.redirectUrl && (
                <a href={form.thankYouScreen.redirectUrl} className="w-full py-3.5 bg-[#043200] text-white rounded-xl font-bold hover:bg-[#064e00] transition-colors shadow-lg shadow-gray-200">
                    Ir al enlace
                </a>
             )}
             {onBack && (
                 <button 
                    onClick={onBack}
                    className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                 >
                    {form.thankYouScreen.buttonText || "Volver"}
                 </button>
             )}
            </div>
          </div>

          {/* Bottom Receipt Zig-Zag Decoration (Visual trick using css gradient) */}
          <div className="h-4 w-full bg-white relative" style={{
            backgroundImage: "linear-gradient(135deg, #f3f4f6 25%, transparent 25%), linear-gradient(225deg, #f3f4f6 25%, transparent 25%)",
            backgroundPosition: "0 0",
            backgroundSize: "20px 20px"
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {onBack && (
            <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeftIcon className="mr-2 w-4 h-4" />
            Volver al Dashboard
            </button>
        )}

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Top colored Bar */}
          <div className="bg-[#043200] h-3 w-full"></div>
          
          <div className="px-8 py-10">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{form.title}</h1>
            <p className="text-gray-500 mb-8 text-lg">{form.description}</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {form.fields.map(field => (
                <div key={field.id} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  
                  {field.type === FieldType.SHORT_TEXT && (
                    <input 
                      type="text" 
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 rounded-xl border ${errors[field.id] ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#043200] focus:ring-4 focus:ring-green-900/10'} outline-none transition-all`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.LONG_TEXT && (
                    <textarea 
                      rows={4}
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 rounded-xl border ${errors[field.id] ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#043200] focus:ring-4 focus:ring-green-900/10'} outline-none transition-all`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.NUMBER && (
                    <input 
                      type="number"
                      placeholder={field.placeholder}
                      className={`w-full px-4 py-3 rounded-xl border ${errors[field.id] ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#043200] focus:ring-4 focus:ring-green-900/10'} outline-none transition-all`}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                    />
                  )}

                  {field.type === FieldType.SINGLE_SELECT && (
                    <div className="space-y-2">
                      {field.options?.map(opt => (
                        <label key={opt} className="flex items-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                          <input 
                            type="radio" 
                            name={field.id} 
                            value={opt}
                            className="h-4 w-4 text-[#043200] focus:ring-[#043200] border-gray-300"
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                          />
                          <span className="ml-3 text-gray-700 font-medium">{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === FieldType.IMAGE_UPLOAD && (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor={field.id} className="relative cursor-pointer bg-white rounded-md font-medium text-[#043200] hover:text-[#064e00] focus-within:outline-none">
                            <span>Subir un archivo</span>
                            <input id={field.id} name={field.id} type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(field.id, e)} />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG hasta 2MB (Google Sheets puede truncar imágenes grandes)</p>
                        {answers[field.id] && (
                            <p className="text-xs text-green-700 font-bold mt-2">Imagen seleccionada</p>
                        )}
                      </div>
                    </div>
                  )}

                  {errors[field.id] && (
                    <p className="text-sm text-red-500 font-medium mt-1 ml-1">{errors[field.id]}</p>
                  )}
                </div>
              ))}

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-4 px-4 border border-transparent shadow-sm text-lg font-medium rounded-xl text-white bg-[#043200] hover:bg-[#064e00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};