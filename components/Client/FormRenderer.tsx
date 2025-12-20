
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FormSchema, FieldType, FormResponse } from '../../types';
import { ArrowLeftIcon, CheckIcon, DownloadIcon, TagIcon, ClockIcon, PlusIcon, TrashIcon, CalendarIcon, StarIcon } from '../ui/Icons';

interface FormRendererProps {
  form: FormSchema;
  onBack?: () => void;
}

const SYSTEM_DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";
const HOTEL_BG_IMAGE = "https://images.unsplash.com/photo-1571896349842-6e53ce41e86c?q=80&w=2071&auto=format&fit=crop";

interface GuestData {
    name: string;
    idNum: string;
}

// --- COMPONENTE DE ESTRELLAS ---
const StarRating = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className="flex items-center gap-2 p-4 bg-dark-800/40 border border-dark-700 rounded-2xl w-fit">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1 transition-all transform hover:scale-125 focus:outline-none"
                >
                    <StarIcon 
                        filled={(hover || value) >= star} 
                        className={`w-10 h-10 transition-colors ${
                            (hover || value) >= star ? 'text-eco-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-dark-600'
                        }`}
                    />
                </button>
            ))}
            {value > 0 && (
                <span className="ml-4 text-sm font-black text-eco-400 uppercase tracking-widest">{value} / 5</span>
            )}
        </div>
    );
};

// --- COMPONENTE CALENDARIO PERSONALIZADO CON POSICIONAMIENTO INTELIGENTE ---
const CustomDatePicker = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
    const [dropUp, setDropUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropUp(spaceBelow < 320);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

    const renderDays = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const days = [];
        const totalDays = daysInMonth(month, year);
        const firstDay = firstDayOfMonth(month, year);

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-9 w-9"></div>);
        }

        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = value === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => {
                        onChange(dateStr);
                        setIsOpen(false);
                    }}
                    className={`h-9 w-9 rounded-full text-xs font-bold transition-all flex items-center justify-center
                        ${isSelected ? 'bg-eco-500 text-dark-900 shadow-glow scale-110' : 
                          isToday ? 'border border-eco-500/50 text-eco-400' : 'text-gray-300 hover:bg-dark-700'}`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full pl-12 pr-4 py-4 bg-dark-800 border rounded-2xl text-white outline-none transition-all font-medium cursor-pointer flex items-center justify-between group ${isOpen ? 'border-eco-500 ring-4 ring-eco-500/10' : 'border-dark-700 hover:border-dark-600'}`}
            >
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isOpen ? 'text-eco-400' : 'text-dark-muted'}`}>
                    <CalendarIcon className="w-5 h-5" />
                </div>
                <span className={value ? 'text-white' : 'text-dark-muted'}>
                    {value ? new Date(value + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : placeholder}
                </span>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-eco-400' : 'text-dark-muted'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>

            {isOpen && (
                <div 
                    className={`absolute left-0 w-full min-w-[300px] bg-dark-900/95 backdrop-blur-xl border border-dark-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 z-[100] animate-in fade-in zoom-in-95 duration-200
                    ${dropUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                >
                    <div className="flex justify-between items-center mb-5 px-1">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-dark-800 rounded-xl text-dark-muted hover:text-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="flex flex-col items-center">
                            <span className="font-black text-xs text-eco-400 uppercase tracking-widest">{monthNames[currentDate.getMonth()]}</span>
                            <span className="font-bold text-lg text-white leading-none mt-0.5">{currentDate.getFullYear()}</span>
                        </div>
                        <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-dark-800 rounded-xl text-dark-muted hover:text-white transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {dayNames.map(d => <div key={d} className="h-9 flex items-center justify-center text-[10px] font-black text-dark-muted tracking-tighter opacity-60">{d}</div>)}
                        {renderDays()}
                    </div>

                    <div className="flex justify-between mt-5 pt-4 border-t border-dark-700/50">
                        <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-400/10 uppercase tracking-widest transition-colors">Limpiar</button>
                        <button type="button" onClick={() => { setCurrentDate(new Date()); }} className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-eco-400 hover:bg-eco-400/10 uppercase tracking-widest transition-colors">Hoy</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const FormRenderer: React.FC<FormRendererProps> = ({ form, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bgImage = form.backgroundImageUrl || HOTEL_BG_IMAGE;

  const stayInfo = useMemo(() => {
    const dateFields = form.fields.filter(f => f.type === FieldType.DATE);
    const checkinField = dateFields.find(f => /entrada|llegada|check-in|checkin|desde/i.test(f.label));
    const checkoutField = dateFields.find(f => /salida|ida|check-out|checkout|hasta/i.test(f.label));

    if (checkinField && checkoutField && answers[checkinField.id] && answers[checkoutField.id]) {
      const start = new Date(answers[checkinField.id] + 'T12:00:00');
      const end = new Date(answers[checkoutField.id] + 'T12:00:00');
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  }, [answers, form.fields]);

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const addGuest = (fieldId: string) => {
      setAnswers(prev => {
          const current = prev[fieldId] || [];
          return { ...prev, [fieldId]: [...current, { name: '', idNum: '' }] };
      });
  };

  const removeGuest = (fieldId: string, index: number) => {
      setAnswers(prev => {
          const current = prev[fieldId] || [];
          return { ...prev, [fieldId]: current.filter((_: any, i: number) => i !== index) };
      });
  };

  const updateGuestData = (fieldId: string, index: number, key: keyof GuestData, value: string) => {
      setAnswers(prev => {
          const current = [...(prev[fieldId] || [])];
          current[index] = { ...current[index], [key]: value };
          return { ...prev, [fieldId]: current };
      });
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
              const selectedLabels = (answers[field.id] as string[]) || [];
              selectedLabels.forEach(lbl => {
                  const opt = field.productOptions?.find(o => o.label === lbl);
                  if (opt) {
                      const multiplier = opt.isPerNight ? (nights > 0 ? nights : 1) : 1;
                      total += (opt.price * multiplier);
                  }
              });
          }

          if (field.type === FieldType.ADDITIONAL_PERSON) {
              const guests = (answers[field.id] as GuestData[]) || [];
              const count = guests.length;
              if (count > 0) {
                  const multiplier = field.isPerNight ? (nights > 0 ? nights : 1) : 1;
                  total += ((field.additionalPrice || 0) * count * multiplier);
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
        if (f.type === FieldType.ADDITIONAL_PERSON) {
            const guests = (val as GuestData[]) || [];
            cleanData[f.label] = guests.length > 0 
                ? `${guests.length} Adicionales: ` + guests.map(g => `${g.name} (${g.idNum})`).join(' | ') 
                : "Ninguno";
        } else {
            cleanData[f.label] = Array.isArray(val) ? val.join(', ') : (val || ""); 
        }
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
    const { total, paid, remaining, nights } = calculateFinancials();
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
             {nights > 0 && <p className="text-xs text-eco-400/70 uppercase font-bold">Reserva por {nights} noches</p>}
          </div>
          <button onClick={onBack} className="w-full py-3 bg-eco-600 rounded-xl font-bold hover:bg-eco-500 transition-colors">Volver</button>
        </div>
      </div>
    );
  }

  const { total, remaining, nights } = calculateFinancials();
  const hasDynamicPricing = form.fields.some(f => 
    (f.type === FieldType.PRODUCT && f.productOptions?.some(o => o.isPerNight)) || 
    (f.type === FieldType.ADDITIONAL_PERSON && f.isPerNight)
  );
  const needsDatesForCalculation = hasDynamicPricing && nights === 0;

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-eco-500/30">
      <div className="relative h-64 w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-950 z-10"></div>
          <img src={bgImage} className="w-full h-full object-cover opacity-60" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-48 -mt-20 relative z-20">
        <div className="bg-dark-900 border border-dark-800 rounded-3xl shadow-2xl relative">
          <div className="h-1.5 bg-gradient-to-r from-eco-600 to-eco-400 w-full rounded-t-3xl"></div>
          
          <div className="px-8 py-10">
            <h1 className="text-3xl font-bold mb-2 tracking-tight text-white">{form.title}</h1>
            <p className="text-dark-muted mb-8 leading-relaxed">{form.description}</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {form.fields.map(field => (
                <div key={field.id} className="space-y-3">
                  <label className="text-xs font-bold text-dark-muted uppercase tracking-widest block mb-1 ml-1">{field.label}</label>
                  
                  {field.type === FieldType.DATE && (
                    <CustomDatePicker 
                        value={answers[field.id] || ''} 
                        onChange={(val) => handleInputChange(field.id, val)} 
                        placeholder="Seleccionar fecha..."
                    />
                  )}

                  {field.type === FieldType.STAR_RATING && (
                      <StarRating 
                        value={answers[field.id] || 0} 
                        onChange={(val) => handleInputChange(field.id, val)} 
                      />
                  )}

                  {field.type === FieldType.ADDITIONAL_PERSON && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-dark-800/40 p-5 rounded-2xl border border-dark-700/50 backdrop-blur-sm">
                             <div>
                                <p className="font-bold text-sm text-white">Huéspedes Adicionales</p>
                                <p className="text-[10px] text-eco-400 font-bold uppercase tracking-widest mt-0.5">
                                    {formatMoney(field.additionalPrice || 0)} {field.isPerNight ? 'por noche/persona' : 'por persona'}
                                </p>
                             </div>
                             <button 
                                type="button"
                                onClick={() => addGuest(field.id)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-eco-500/10 border border-eco-500/40 text-eco-400 rounded-xl text-xs font-bold hover:bg-eco-500 hover:text-dark-900 transition-all active:scale-95"
                             >
                                <PlusIcon className="w-4 h-4" />
                                Añadir
                             </button>
                        </div>

                        <div className="space-y-3">
                            {(answers[field.id] as GuestData[])?.map((guest, idx) => (
                                <div key={idx} className="bg-dark-800/30 border border-dark-700 p-5 rounded-2xl relative animate-in zoom-in-95 slide-in-from-top-2 duration-300">
                                    <button 
                                        type="button"
                                        onClick={() => removeGuest(field.id, idx)}
                                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-xl hover:scale-110 active:scale-90"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-dark-muted uppercase tracking-widest ml-1 text-[9px]">Nombre Completo</label>
                                            <input 
                                                type="text" 
                                                value={guest.name}
                                                placeholder="Ej: María López" 
                                                className="w-full px-4 py-3 bg-dark-900/60 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500 text-sm transition-all" 
                                                onChange={(e) => updateGuestData(field.id, idx, 'name', e.target.value)} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-dark-muted uppercase tracking-widest ml-1 text-[9px]">Documento / ID</label>
                                            <input 
                                                type="text" 
                                                value={guest.idNum}
                                                placeholder="Cédula / Pasaporte" 
                                                className="w-full px-4 py-3 bg-dark-900/60 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500 text-sm transition-all" 
                                                onChange={(e) => updateGuestData(field.id, idx, 'idNum', e.target.value)} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                      </div>
                  )}

                  {field.type === FieldType.PRODUCT && (
                    <div className="space-y-3">
                      {field.productOptions?.map(opt => {
                        const isSelected = (answers[field.id] as string[])?.includes(opt.label);
                        return (
                          <label key={opt.label} className={`flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-eco-500/5 border-eco-500/50 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-dark-800/40 border-dark-700 hover:border-dark-600'}`}>
                            <div className="flex items-center gap-4">
                                <input type="checkbox" className="hidden" onChange={(e) => handleProductSelection(field.id, opt.label, e.target.checked)} />
                                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-eco-500 border-eco-500 text-dark-900' : 'border-dark-700 bg-dark-900'}`}>{isSelected && <CheckIcon className="w-4 h-4" />}</div>
                                <div>
                                    <p className={`font-semibold transition-colors ${isSelected ? 'text-white' : 'text-gray-300'}`}>{opt.label}</p>
                                    {opt.isPerNight && <p className="text-[10px] text-eco-400 font-bold uppercase tracking-widest">Precio por noche</p>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-eco-400 text-lg">{formatMoney(opt.price)}</p>
                                {opt.isPerNight && isSelected && (
                                    <p className="text-[10px] text-dark-muted font-medium italic mt-0.5">
                                        {nights > 0 ? `Total: ${formatMoney(opt.price * nights)} (${nights}n)` : '(Define fechas)'}
                                    </p>
                                )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {field.type === FieldType.SHORT_TEXT && (
                    <input type="text" className="w-full px-5 py-4 bg-dark-800 border border-dark-700 rounded-2xl text-white outline-none focus:border-eco-500 focus:ring-4 focus:ring-eco-500/10 transition-all font-medium" onChange={(e) => handleInputChange(field.id, e.target.value)} />
                  )}

                  {(field.type === FieldType.NUMBER || field.type === FieldType.PAYMENT) && (
                     <div className="relative group">
                        {field.type === FieldType.PAYMENT && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-dark-muted group-focus-within:text-eco-400 transition-colors font-bold">$</span>}
                        <input type="number" className={`w-full px-5 py-4 bg-dark-800 border border-dark-700 rounded-2xl text-white outline-none focus:border-eco-500 focus:ring-4 focus:ring-eco-500/10 transition-all font-medium ${field.type === FieldType.PAYMENT ? 'pl-10' : ''}`} onChange={(e) => handleInputChange(field.id, e.target.value)} />
                     </div>
                  )}
                </div>
              ))}

              <div className="pt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-5 bg-gradient-to-r from-eco-600 to-eco-500 text-dark-900 font-extrabold text-lg rounded-2xl hover:from-eco-500 hover:to-eco-400 transition-all shadow-[0_10px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_15px_45px_rgba(34,197,94,0.45)] disabled:opacity-50 active:scale-[0.98] transform hover:scale-[1.01]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-[3px] border-dark-900/30 border-t-dark-900 rounded-full animate-spin"></div>
                        Procesando...
                    </div>
                  ) : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {(total > 0 || needsDatesForCalculation) && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-dark-900/95 backdrop-blur-2xl border-t border-dark-800/50 z-[90] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-2xl mx-auto flex justify-between items-center gap-6">
            <div className="flex flex-col">
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-[0.2em] mb-1.5 opacity-80">Total Estimado {nights > 0 ? `(${nights} noches)` : ''}</p>
              <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-black text-white leading-none tracking-tight">{formatMoney(total)}</p>
              </div>
              {needsDatesForCalculation && (
                <div className="flex items-center gap-2 text-[10px] text-amber-400 font-bold animate-pulse mt-2 bg-amber-400/5 px-2 py-1 rounded-lg w-fit">
                   <ClockIcon className="w-3.5 h-3.5" />
                   SELECCIONA FECHAS PARA ACTUALIZAR
                </div>
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              <p className="text-[10px] text-dark-muted font-bold uppercase tracking-[0.2em] mb-1.5 opacity-80">Saldo Pendiente</p>
              <p className="text-2xl font-black text-eco-400 leading-none tracking-tight">{formatMoney(remaining)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
