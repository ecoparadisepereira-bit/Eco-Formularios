
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FormSchema, FieldType, FormResponse, FormField } from '../../types';
import { ArrowLeftIcon, CheckIcon, DownloadIcon, TagIcon, ClockIcon, PlusIcon, TrashIcon, CalendarIcon, StarIcon } from '../ui/Icons';

interface FormRendererProps {
  form: FormSchema;
  onBack?: () => void;
}

const SYSTEM_DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbyQscuJzzO-2lQQiTwuNTL0-LrCQ-82LcVa8npwaK7AuG7LJa4sCLqJKSmL5qDZG851/exec";
const HOTEL_BG_IMAGE = "https://images.unsplash.com/photo-1571896349842-6e53ce41e86c?q=80&w=2071&auto=format&fit=crop";

interface GuestData {
    name: string;
    idType: string;
    idNum: string;
}

const DOCUMENT_TYPES = ["CC", "CE", "Pasaporte", "TI", "Registro Civil"];

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

// --- COMPONENTE CALENDARIO CON SELECTOR DE AÑO MEJORADO ---
const CustomDatePicker = ({ value, onChange, placeholder }: { value: string, onChange: (val: string) => void, placeholder: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(value ? new Date(value + 'T12:00:00') : new Date());
    const [showYearSelector, setShowYearSelector] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const yearListRef = useRef<HTMLDivElement>(null);

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowYearSelector(false);
            }
        };

        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            setDropUp(spaceBelow < 350);
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // Auto-scroll al año seleccionado cuando se abre el selector
    useEffect(() => {
        if (showYearSelector && yearListRef.current) {
            const selectedYearBtn = yearListRef.current.querySelector('[data-selected="true"]');
            if (selectedYearBtn) {
                selectedYearBtn.scrollIntoView({ block: 'center', behavior: 'instant' as any });
            }
        }
    }, [showYearSelector]);

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

    const changeYear = (year: number) => {
        const newDate = new Date(year, currentDate.getMonth(), 1);
        setCurrentDate(newDate);
        setShowYearSelector(false);
    };

    const years = useMemo(() => {
        const list = [];
        // Rango ampliado para cubrir nacimientos o reservas lejanas
        for (let y = 1940; y <= 2100; y++) {
            list.push(y);
        }
        return list;
    }, []);

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
                        {!showYearSelector && (
                            <button type="button" onClick={() => changeMonth(-1)} className="p-2 hover:bg-dark-800 rounded-xl text-dark-muted hover:text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                        )}
                        
                        <div className={`flex flex-col items-center ${showYearSelector ? 'w-full' : ''}`}>
                            <span className="font-black text-[10px] text-eco-400 uppercase tracking-widest mb-1">{monthNames[currentDate.getMonth()]}</span>
                            <button 
                                type="button" 
                                onClick={() => setShowYearSelector(!showYearSelector)}
                                className="font-bold text-lg text-white leading-none hover:text-eco-400 flex items-center gap-1 transition-colors"
                            >
                                {currentDate.getFullYear()}
                                <svg className={`w-3 h-3 transition-transform ${showYearSelector ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>

                        {!showYearSelector && (
                            <button type="button" onClick={() => changeMonth(1)} className="p-2 hover:bg-dark-800 rounded-xl text-dark-muted hover:text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        )}
                    </div>

                    {showYearSelector ? (
                        <div 
                            ref={yearListRef}
                            className="grid grid-cols-4 gap-2 h-56 overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
                        >
                            {years.map(y => (
                                <button 
                                    key={y} 
                                    onClick={() => changeYear(y)}
                                    data-selected={currentDate.getFullYear() === y}
                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${currentDate.getFullYear() === y ? 'bg-eco-500 text-dark-900' : 'text-dark-muted hover:bg-dark-800 hover:text-white'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-7 gap-1.5 mb-2">
                                {dayNames.map(d => <div key={d} className="h-9 flex items-center justify-center text-[10px] font-black text-dark-muted tracking-tighter opacity-60">{d}</div>)}
                                {renderDays()}
                            </div>
                            <div className="flex justify-between mt-5 pt-4 border-t border-dark-700/50">
                                <button type="button" onClick={() => { onChange(''); setIsOpen(false); }} className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-red-400 hover:bg-red-400/10 uppercase tracking-widest transition-colors">Limpiar</button>
                                <button type="button" onClick={() => { setCurrentDate(new Date()); }} className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-eco-400 hover:bg-eco-400/10 uppercase tracking-widest transition-colors">Hoy</button>
                            </div>
                        </>
                    )}
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
          return { ...prev, [fieldId]: [...current, { name: '', idType: 'CC', idNum: '' }] };
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

  const interpolateMessage = (message: string, answers: Record<string, any>, financials: any, fields: FormField[]) => {
      let result = message;
      
      // Interpolate financials con negrita manual
      result = result.replace(/@total/gi, `${formatMoney(financials.total)}`);
      result = result.replace(/@abono/gi, `${formatMoney(financials.paid)}`);
      result = result.replace(/@pendiente/gi, `${formatMoney(financials.remaining)}`);
      result = result.replace(/@noches/gi, `${financials.nights}`);

      // Interpolate field labels
      fields.forEach(field => {
          const val = answers[field.id];
          let displayVal = "";
          if (Array.isArray(val)) {
              if (field.type === FieldType.ADDITIONAL_PERSON) {
                  displayVal = val.length > 0 ? val.map((g: GuestData) => `${g.name} (${g.idType} ${g.idNum})`).join(', ') : "Ninguno";
              } else {
                  displayVal = val.join(', ');
              }
          } else {
              displayVal = val !== undefined && val !== null ? String(val) : "";
          }

          const regex = new RegExp(`@${field.label}`, 'gi');
          result = result.replace(regex, `${displayVal}`);
      });

      // Búsquedas secundarias por términos clave si las etiquetas no coinciden exactas
      result = result.replace(/@Nombre Completo/gi, `${answers[fields.find(f => /nombre/i.test(f.label))?.id || ''] || ''}`);
      result = result.replace(/@Número de teléfono/gi, `${answers[fields.find(f => /teléfono|whatsapp/i.test(f.label))?.id || ''] || ''}`);
      result = result.replace(/@Fecha de su reserva/gi, `${answers[fields.find(f => /fecha|entrada/i.test(f.label))?.id || ''] || ''}`);
      result = result.replace(/@Habitación reservada/gi, `${answers[fields.find(f => f.type === FieldType.PRODUCT)?.id || '']?.join(', ') || ''}`);
      result = result.replace(/@Número de Documento/gi, `${answers[fields.find(f => /documento|identificación/i.test(f.label))?.id || ''] || ''}`);

      return result;
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
                ? `${guests.length} Adicionales: ` + guests.map(g => `${g.name} (${g.idType} ${g.idNum})`).join(' | ') 
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
    const financials = calculateFinancials();
    const { total, remaining, nights, paid } = financials;
    const formattedDate = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    return (
      <div className="min-h-screen bg-dark-950 text-dark-900 flex flex-col items-center justify-center p-4">
        {/* Voucher Digital Estilo Blanco Profesional */}
        <div className="bg-white rounded-[40px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col relative">
          
          <div className="bg-white px-10 pt-12 pb-6 text-center relative border-b border-gray-100">
             <div className="absolute top-5 left-1/2 -translate-x-1/2">
                <div className="w-12 h-1.5 bg-eco-500 rounded-full"></div>
             </div>
             <div className="w-16 h-16 bg-eco-50 flex items-center justify-center rounded-[24px] mx-auto mb-5 shadow-inner">
                <CheckIcon className="w-9 h-9 text-eco-500" />
             </div>
             <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">¡Reserva Exitosa!</h2>
             <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">{formattedDate}</p>
          </div>

          <div className="px-10 py-10 text-gray-700 leading-relaxed text-[15px] space-y-4 font-medium">
              <p className="whitespace-pre-wrap">
                  {interpolateMessage(form.thankYouScreen.message, answers, financials, form.fields)}
              </p>
          </div>

          <div className="bg-gray-50 mx-8 mb-8 p-8 rounded-[32px] border border-gray-100/50 shadow-sm">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200/50">
                  <span className="text-[11px] font-black text-eco-600 uppercase tracking-widest">Ticket Detallado</span>
                  {nights > 0 && <span className="bg-eco-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter shadow-sm">{nights} Noches</span>}
              </div>

              <div className="space-y-7">
                  {/* Unidad Reservada */}
                  {form.fields.filter(f => f.type === FieldType.PRODUCT && answers[f.id]?.length > 0).map(field => (
                      <div key={field.id} className="flex gap-5">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-eco-500 flex-shrink-0 shadow-sm">
                             <TagIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Alojamiento</p>
                              <p className="text-sm font-bold text-gray-800 leading-tight">{(answers[field.id] as string[]).join(', ')}</p>
                          </div>
                      </div>
                  ))}

                  {/* Invitados */}
                  {form.fields.filter(f => f.type === FieldType.ADDITIONAL_PERSON && (answers[f.id] as GuestData[])?.length > 0).map(field => (
                      <div key={field.id} className="flex gap-5">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-amber-500 flex-shrink-0 shadow-sm">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          </div>
                          <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Acompañantes</p>
                              <div className="space-y-1.5">
                                {(answers[field.id] as GuestData[]).map((g, i) => (
                                    <p key={i} className="text-xs font-bold text-gray-700">{g.name} <span className="text-[10px] text-gray-400 font-mono ml-2">({g.idType}: {g.idNum})</span></p>
                                ))}
                              </div>
                          </div>
                      </div>
                  ))}

                  {/* Finanzas en Recibo */}
                  <div className="pt-6 border-t border-dashed border-gray-200 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.15em]">Subtotal Estancia</span>
                          <span className="font-bold text-gray-800">{formatMoney(total)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400 font-black uppercase text-[10px] tracking-[0.15em]">Abono Confirmado</span>
                          <span className="font-bold text-gray-800">{formatMoney(paid)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 mt-1">
                          <span className="text-red-500 font-black uppercase text-[11px] tracking-[0.2em]">Saldo Pendiente</span>
                          <div className="text-right">
                              <p className="font-black text-2xl text-eco-500 tracking-tighter leading-none">{formatMoney(remaining)}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="px-10 pb-12 mt-auto">
              <button onClick={onBack} className="w-full py-5 bg-dark-900 text-white rounded-[20px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-[0.97] shadow-lg">
                  Finalizar Proceso
              </button>
              <div className="flex items-center justify-center gap-2 mt-6 opacity-40">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em]">Ecoparadise Systems</p>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
          </div>
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
                                    <div className="grid grid-cols-1 gap-5">
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
                                        <div className="grid grid-cols-12 gap-3">
                                            <div className="col-span-4 space-y-2">
                                                <label className="text-[10px] font-bold text-dark-muted uppercase tracking-widest ml-1 text-[9px]">Tipo</label>
                                                <select 
                                                    value={guest.idType}
                                                    onChange={(e) => updateGuestData(field.id, idx, 'idType', e.target.value)}
                                                    className="w-full px-3 py-3 bg-dark-900/60 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500 text-sm transition-all appearance-none cursor-pointer"
                                                >
                                                    {DOCUMENT_TYPES.map(t => <option key={t} value={t} className="bg-dark-900">{t}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-8 space-y-2">
                                                <label className="text-[10px] font-bold text-dark-muted uppercase tracking-widest ml-1 text-[9px]">Documento / ID</label>
                                                <input 
                                                    type="text" 
                                                    value={guest.idNum}
                                                    placeholder="Número de ID" 
                                                    className="w-full px-4 py-3 bg-dark-900/60 border border-dark-700 rounded-xl text-white outline-none focus:border-eco-500 text-sm transition-all" 
                                                    onChange={(e) => updateGuestData(field.id, idx, 'idNum', e.target.value)} 
                                                />
                                            </div>
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
