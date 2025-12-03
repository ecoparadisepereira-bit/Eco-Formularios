import React, { useEffect, useState } from 'react';
import { FormSchema, FormResponse, FieldType } from '../../types';
import { storageService } from '../../services/storageService';
import { ArrowLeftIcon, DownloadIcon, SearchIcon, RefreshIcon, EyeIcon, CheckIcon } from '../ui/Icons';

interface ResponseViewerProps {
  form: FormSchema;
  onBack: () => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ form, onBack }) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [allRawResponses, setAllRawResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllRaw, setShowAllRaw] = useState(false);
  
  const [viewingReceipt, setViewingReceipt] = useState<FormResponse | null>(null);

  // Check if form has financials (Exact type or smart keyword)
  const hasFinancials = form.fields.some(f => 
    f.type === FieldType.PRODUCT || 
    f.type === FieldType.PAYMENT ||
    (f.type === FieldType.NUMBER && /abono|pago|anticipo|seña|adelanto/i.test(f.label))
  );

  const formatMoney = (amount: any) => {
      if (amount === 0) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(0);
      if (!amount) return '-';
      const num = parseFloat(amount);
      if (isNaN(num)) return amount;
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const getFuzzyValue = (answers: any, label: string) => {
    if (!answers) return '';
    if (answers[label] !== undefined) return answers[label];
    const normalizedLabel = label.toLowerCase().trim();
    const foundKey = Object.keys(answers).find(k => k.toLowerCase().trim() === normalizedLabel);
    return foundKey ? answers[foundKey] : '';
  };

  const renderSafeValue = (val: any) => {
    if (val === null || val === undefined) return '-';
    if (typeof val === 'object') {
        try { return JSON.stringify(val); } catch (e) { return '[Obj]'; }
    }
    return String(val);
  };

  // Recalculate totals on the fly if missing from DB (Backward compatibility)
  const getDerivedFinancials = (response: FormResponse) => {
      // Try to get stored values first
      let total = parseFloat(response.answers['Total Calculado'] as string);
      let paid = parseFloat(response.answers['Total Abono'] as string);
      
      // If not stored (NaN), recalculate based on schema + answers
      if (isNaN(total) || isNaN(paid)) {
          total = 0;
          paid = 0;
          
          form.fields.forEach(field => {
               // Products
               if (field.type === FieldType.PRODUCT && field.productOptions) {
                  const val = getFuzzyValue(response.answers, field.label);
                  let selected: string[] = [];
                  if (Array.isArray(val)) selected = val;
                  else if (typeof val === 'string') selected = val.split(',').map(s => s.trim());

                  selected.forEach(lbl => {
                      const opt = field.productOptions?.find(o => o.label === lbl);
                      if (opt) total += opt.price;
                  });
               }

               // Payments (Smart Detect)
               const isExplicitPayment = field.type === FieldType.PAYMENT;
               const isImplicitPayment = field.type === FieldType.NUMBER && /abono|pago|anticipo|seña|adelanto/i.test(field.label);
               
               if (isExplicitPayment || isImplicitPayment) {
                   const valStr = getFuzzyValue(response.answers, field.label);
                   const val = parseFloat(String(valStr || '0').replace(/[^0-9.-]+/g,""));
                   if (!isNaN(val)) paid += val;
               }
          });
      }
      
      // Safety check if total was explicitly 0 in DB
      if (response.answers['Total Calculado'] === 0) total = 0;
      if (response.answers['Total Abono'] === 0) paid = 0;

      return { total, paid, remaining: total - paid };
  };

  const loadData = async () => {
    setLoading(true);
    try {
        const allData = await storageService.fetchResponses(form.id, form.googleSheetUrl);
        setAllRawResponses(allData);
        const relevantData = allData.filter(row => {
            if (row.formId === form.id) return true;
            return form.fields.some(field => {
                const val = getFuzzyValue(row.answers, field.label);
                return val !== '' && val !== null && val !== undefined;
            });
        });
        setResponses(relevantData.sort((a, b) => b.submittedAt - a.submittedAt));
    } catch (err: any) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [form.id]);

  const dataToDisplay = showAllRaw ? allRawResponses : responses;
  const filteredResponses = dataToDisplay.filter(r => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    if (new Date(r.submittedAt).toLocaleString().toLowerCase().includes(lowerTerm)) return true;
    if (showAllRaw) {
        return Object.values(r.answers).some(val => String(val).toLowerCase().includes(lowerTerm));
    } else {
        return form.fields.some(field => {
            const val = getFuzzyValue(r.answers, field.label);
            return String(val).toLowerCase().includes(lowerTerm);
        });
    }
  });

  const downloadCSV = () => {
    const headers = showAllRaw 
        ? ['Fecha', ...Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId')]
        : ['Fecha Envío', ...form.fields.map(f => f.label.replace(/,/g, '')), ...(hasFinancials ? ['Total', 'Abono', 'Pendiente'] : [])]; 
    const rows = filteredResponses.map(r => {
      const date = new Date(r.submittedAt).toLocaleString();
      let answerCells: string[] = [];
      if (showAllRaw) {
         const keys = Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId');
         answerCells = keys.map(k => `"${renderSafeValue(r.answers[k]).replace(/"/g, '""')}"`);
      } else {
         answerCells = form.fields.map(f => `"${renderSafeValue(getFuzzyValue(r.answers, f.label)).replace(/"/g, '""')}"`);
         if (hasFinancials) {
             const { total, paid, remaining } = getDerivedFinancials(r);
             answerCells.push(`"${formatMoney(total)}"`);
             answerCells.push(`"${formatMoney(paid)}"`);
             answerCells.push(`"${formatMoney(remaining)}"`);
         }
      }
      return [date, ...answerCells].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `respuestas_${form.id}.csv`;
    link.click();
  };

  const getInterpolatedReceiptMessage = () => {
    if (!viewingReceipt) return '';
    let message = form.thankYouScreen.message;
    form.fields.forEach(field => {
        let answer = getFuzzyValue(viewingReceipt.answers, field.label);
        if (Array.isArray(answer)) answer = answer.join(', ');
        const displayValue = answer !== undefined && answer !== null ? String(answer) : '';
        const regex = new RegExp(`@${field.label}`, 'gi');
        message = message.replace(regex, `<span class="font-bold text-dark-900">${displayValue}</span>`);
    });
    
    // Interpolate financials using safe derived values
    const { total, paid, remaining } = getDerivedFinancials(viewingReceipt);

    message = message.replace(/@total/gi, `<span class="font-bold text-dark-900">${formatMoney(total)}</span>`);
    message = message.replace(/@abono/gi, `<span class="font-bold text-dark-900">${formatMoney(paid)}</span>`);
    message = message.replace(/@pendiente/gi, `<span class="font-bold text-dark-900">${formatMoney(remaining)}</span>`);

    return message.replace(/\n/g, '<br/>');
  };


  return (
    <div className="animate-in fade-in duration-500">
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-dark-800 rounded-full text-dark-muted hover:text-white transition-colors">
                      <ArrowLeftIcon />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Resultados</h2>
                      <p className="text-dark-muted text-sm">{form.title}</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                     {/* Raw Switch */}
                     <div className="flex items-center gap-3 bg-dark-800 px-3 py-1.5 rounded-lg border border-dark-700">
                        <span className="text-xs font-bold text-dark-muted uppercase">Modo Crudo</span>
                        <button 
                            onClick={() => setShowAllRaw(!showAllRaw)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${showAllRaw ? 'bg-eco-500' : 'bg-dark-600'}`}
                        >
                            <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${showAllRaw ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    <button 
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700 hover:text-eco-400 transition-colors font-medium text-sm"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        CSV
                    </button>
                    <button 
                        onClick={loadData}
                        className="p-2 bg-eco-500 text-dark-900 rounded-lg hover:bg-eco-400 transition-colors"
                    >
                        <RefreshIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="bg-dark-800 p-2 rounded-xl border border-dark-700 flex items-center gap-2 max-w-md">
                <SearchIcon className="w-5 h-5 text-dark-muted ml-2" />
                <input 
                    type="text" 
                    placeholder="Filtrar respuestas..." 
                    className="w-full bg-transparent outline-none text-white placeholder-dark-600 text-sm py-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-dark-900/50 border-b border-dark-700">
                    <th className="px-6 py-4 text-xs font-bold text-dark-muted uppercase tracking-wider whitespace-nowrap">Fecha</th>
                    {!showAllRaw && <th className="px-6 py-4 text-xs font-bold text-dark-muted uppercase tracking-wider text-center w-20">Ver</th>}
                    {showAllRaw ? (
                        Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId').map(key => (
                            <th key={key} className="px-6 py-4 text-xs font-bold text-dark-muted uppercase tracking-wider min-w-[150px]">{key}</th>
                        ))
                    ) : (
                        <>
                            {form.fields.map(field => (
                                <th key={field.id} className="px-6 py-4 text-xs font-bold text-dark-muted uppercase tracking-wider min-w-[150px]">{field.label}</th>
                            ))}
                            {hasFinancials && (
                                <>
                                    <th className="px-6 py-4 text-xs font-bold text-eco-400 uppercase tracking-wider min-w-[100px]">Total</th>
                                    <th className="px-6 py-4 text-xs font-bold text-eco-400 uppercase tracking-wider min-w-[100px]">Abono</th>
                                    <th className="px-6 py-4 text-xs font-bold text-red-400 uppercase tracking-wider min-w-[100px]">Pendiente</th>
                                </>
                            )}
                        </>
                    )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                    {loading ? (
                        <tr><td colSpan={20} className="px-6 py-12 text-center text-dark-muted">Cargando datos...</td></tr>
                    ) : filteredResponses.length === 0 ? (
                        <tr><td colSpan={20} className="px-6 py-12 text-center text-dark-muted italic">Sin datos encontrados</td></tr>
                    ) : (
                    filteredResponses.map((response) => {
                        const financials = hasFinancials ? getDerivedFinancials(response) : null;
                        return (
                        <tr key={response.id} className="hover:bg-dark-700/50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap font-mono text-xs">
                            {new Date(response.submittedAt).toLocaleString()}
                        </td>

                        {!showAllRaw && (
                            <td className="px-6 py-4 text-center">
                                <button onClick={() => setViewingReceipt(response)} className="text-dark-muted hover:text-eco-400 transition-colors">
                                    <EyeIcon className="w-5 h-5" />
                                </button>
                            </td>
                        )}
                        
                        {showAllRaw ? (
                            Object.keys(allRawResponses[0]?.answers || {}).filter(k => k !== 'Fecha' && k !== 'formId').map(key => (
                                <td key={key} className="px-6 py-4 text-sm text-gray-300">{renderSafeValue(response.answers[key])}</td>
                            ))
                        ) : (
                            <>
                                {form.fields.map(field => {
                                    const val = getFuzzyValue(response.answers, field.label);
                                    return (
                                    <td key={field.id} className="px-6 py-4 text-sm text-gray-300">
                                    {field.type === FieldType.IMAGE_UPLOAD && val ? (
                                        <a href={val as string} target="_blank" className="text-eco-400 hover:underline text-xs">Ver Imagen</a>
                                    ) : (
                                        <span className="line-clamp-1">{renderSafeValue(val)}</span>
                                    )}
                                    </td>
                                )})}
                                {hasFinancials && financials && (
                                    <>
                                        <td className="px-6 py-4 text-sm font-bold text-eco-400">{formatMoney(financials.total)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-white">{formatMoney(financials.paid)}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-red-400">{formatMoney(financials.remaining)}</td>
                                    </>
                                )}
                            </>
                        )}
                        </tr>
                    )})
                    )}
                </tbody>
                </table>
            </div>
        </div>

      {viewingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden relative text-dark-900">
                <div className="h-2 bg-eco-500 w-full"></div>
                <div className="p-8">
                    <button onClick={() => setViewingReceipt(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900">
                        ✕
                    </button>
                    <div className="text-center mb-6">
                        <div className="inline-flex bg-eco-100 p-4 rounded-full mb-4">
                            <CheckIcon className="w-8 h-8 text-eco-600" />
                        </div>
                        <h2 className="text-2xl font-bold">{form.thankYouScreen.title}</h2>
                        <p className="text-gray-500 text-sm mt-1">{new Date(viewingReceipt.submittedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6">
                        <div className="text-gray-600 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: getInterpolatedReceiptMessage() }} />
                    </div>
                    <button onClick={() => setViewingReceipt(null)} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold">Cerrar Recibo</button>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};