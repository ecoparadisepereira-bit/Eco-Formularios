
import React, { useState, useMemo } from 'react';
import { FormSchema, FieldType, FormResponse } from '../../types';
import { ArrowLeftIcon, CheckIcon, DownloadIcon, TagIcon, ClockIcon } from '../ui/Icons';

interface FormRendererProps {
  form: FormSchema;
  onBack?: () => void;
}

const SYSTEM_DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";
const HOTEL_BG_IMAGE = "https://images.unsplash.com/photo-1571896349842-6e53ce41e86c?q=80&w=2071&auto=format&fit=crop";

export const FormRenderer: React.FC<FormRendererProps> = ({ form, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bgImage = form.backgroundImageUrl || HOTEL_BG_IMAGE;

  // Calculamos el número de noches dinámicamente
  const stayInfo = useMemo(() => {
    // Buscamos campos de fecha que parezcan de entrada y salida
    const dateFields = form.fields.filter(f => f.type === FieldType.DATE);
    const checkinField = dateFields.find(f => /entrada|llegada|check-in|checkin|desde/i.test(f.label));
    const checkoutField = dateFields.find(f => /salida|ida|check-out|checkout|hasta/i.test(f.label));

    if (checkinField && checkoutField && answers[checkinField.id] && answers[checkoutField.id]) {
      const start = new Date(answers[checkinField.id]);
      const end = new Date(answers[checkoutField.id]);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  }, [answers, form.fields]);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const handleProductSelection = (fieldId: string, optionLabel: string, isSelected: boolean) => {
    setAnswers(prev => {
        const currentValues = (prev[fieldId] as string[]) || [];
        let newValues = isSelected ? [...currentValues, optionLabel] : currentValues.filter(v => v !== optionLabel);
        return { ...prev, [fieldId]: newValues };
    });
  };

  const calculateFinancials = () => {
      let total = 0;
      let paid = 0;
      const nights = stayInfo;

      form.fields.forEach(field => {
          if (field.type === FieldType.PRODUCT && field.productOptions) {
              const selectedLabels = answers[field.id] as string[];
              if (Array.isArray(selectedLabels)) {
                  selectedLabels.forEach(lbl => {
                      const opt = field.productOptions?.find(o => o.label === lbl);
                      if (opt) {
                          const multiplier = opt.isPerNight ? (nights || 1) : 1;
                          total += (opt.price * multiplier);
                      }
                  });
              }
          }
          
          if (field.type === FieldType.PAYMENT || (field.type === FieldType.NUMBER && /abono|pago|anticipo/i.test(field.label))) {
              const val = parseFloat(String(answers[field.id] || '0').replace(/[^0-9.]/g, ''));
              if (!isNaN(val)) paid += val;
          }
      });

      return { total, paid, remaining: total - paid, nights };
  };

  const formatMoney = (amount: number) => {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { total, paid, remaining } = calculateFinancials();
    const cleanData: Record<string, any> = { formId: form.id, formTitle: form.title };
    
    form.fields.forEach(f => {
        let val = answers[f.id];
        cleanData[f.label] = Array.isArray(val) ? val.join(', ') : (val || ""); 
    });
    
    cleanData['Total Calculado'] = total;
    cleanData['Total Abono'] = paid;
    cleanData['Saldo Pendiente'] = remaining;
    cleanData['Noches Estancia'] = stayInfo;

    try {
        await fetch(form.googleSheetUrl || SYSTEM_DEFAULT_SHEET_URL, {
            method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(cleanData)
        });
        setIsSubmitted(true);
    } catch (error) {
        setIsSubmitted(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    const { total, paid, remaining } = calculateFinancials();
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center p-4">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-eco-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="w-10 h-10 text-eco-400" />
          </div>
          <h2 className="text-2xl font-bold mb-4">{form.thankYouScreen.title}</h2>
          <div className="bg-dark-800 p-4 rounded-xl text-left border border-dark-700 mb-6 space-y-2">
             <p className="text-sm text-dark-muted">Total: <span className="text-white font-bold">{formatMoney(total)}</span></p>
             <p className="text-sm text-dark-muted">Abonado: <span className="text-white font-bold">{formatMoney(paid)}</span></p>
             <p className="text-sm text-dark-muted">Saldo: <span className="text-eco-400 font-bold">{formatMoney(remaining)}</span></p>
             {stayInfo > 0 && <p className="text-xs text-eco-400/70 uppercase font-bold">Reserva por {stayInfo} noches</p>}
          </div>
          <button onClick={onBack} className="w-full py-3 bg-eco-600 rounded-xl font-bold hover:bg-eco-500 transition-colors">Volver</button>
        </div>
      </div>
    );
  }

  const { total, remaining, nights } = calculateFinancials();
  const needsDatesForCalculation = form.fields.some(f => f.type === FieldType.PRODUCT && f.productOptions?.some(o => o.isPerNight)) && nights === 0;

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans">
      <div className="relative h-64 w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-950 z-10"></div>
          <img src={bgImage} className="w-full h-full object-cover opacity-60" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-32 -mt-20 relative z-20">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="h-1 bg-eco-500 w-full"></div>
          <div className="px-8 py-10">
            <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
            <p className="text-dark-muted mb-8">{form.description}</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {form.fields.map(field => (
                <div key={field.id} className="space-y-3">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-wider">{field.label}</label>
                  
                  {field.type === FieldType.DATE && (
                    <input type="date" className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500 [color-scheme:dark]" onChange={(e) => handleInputChange(field.id, e.target.value)} />
                  )}

                  {field.type === FieldType.PRODUCT && (
                    <div className="space-y-3">
                      {field.productOptions?.map(opt => {
                        const isSelected = (answers[field.id] as string[])?.includes(opt.label);
                        return (
                          <label key={opt.label} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-dark-800 border-eco-500' : 'bg-dark-900/50 border-dark-700'}`}>
                            <div className="flex items-center gap-3">
                                <input type="checkbox" className="hidden" onChange={(e) => handleProductSelection(field.id, opt.label, e.target.checked)} />
                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-eco-500 border-eco-500 text-dark-900' : 'border-dark-700'}`}>{isSelected && <CheckIcon className="w-3.5 h-3.5" />}</div>
                                <div>
                                    <p className="font-medium">{opt.label}</p>
                                    {opt.isPerNight && <p className="text-[10px] text-eco-400 font-bold uppercase">Precio por noche</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-eco-400">{formatMoney(opt.price)}</p>
                                {opt.isPerNight && isSelected && nights > 0 && (
                                    <p className="text-[10px] text-dark-muted italic">Total: {formatMoney(opt.price * nights)} ({nights}n)</p>
                                )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === FieldType.SHORT_TEXT && (
                    <input type="text" className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500" onChange={(e) => handleInputChange(field.id, e.target.value)} />
                  )}

                  {field.type === FieldType.NUMBER || field.type === FieldType.PAYMENT ? (
                     <div className="relative">
                        {field.type === FieldType.PAYMENT && <span className="absolute left-4 top-3 text-dark-muted">$</span>}
                        <input type="number" className={`w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500 ${field.type === FieldType.PAYMENT ? 'pl-8' : ''}`} onChange={(e) => handleInputChange(field.id, e.target.value)} />
                     </div>
                  ) : null}
                </div>
              ))}

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-eco-500 text-dark-900 font-bold rounded-xl hover:bg-eco-400 transition-all shadow-glow">
                {isSubmitting ? 'Procesando...' : 'Confirmar Reserva'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-dark-900/90 backdrop-blur-lg border-t border-dark-800 z-30 shadow-2xl">
          <div className="max-w-2xl mx-auto flex justify-between items-center">
            <div>
              <p className="text-[10px] text-dark-muted font-bold uppercase">Total Estimado {nights > 0 ? `(${nights} noches)` : ''}</p>
              <p className="text-2xl font-bold text-white">{formatMoney(total)}</p>
              {needsDatesForCalculation && <p className="text-[9px] text-amber-400 font-bold animate-pulse">Selecciona fechas para calcular por noche</p>}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-dark-muted font-bold uppercase">Saldo Pendiente</p>
              <p className="text-xl font-bold text-eco-400">{formatMoney(remaining)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
