import React, { useEffect, useState } from 'react';
import { FormSchema, FormResponse, FieldType } from '../../types';
import { storageService } from '../../services/storageService';
import { ArrowLeftIcon, DownloadIcon } from '../ui/Icons';

interface ResponseViewerProps {
  form: FormSchema;
  onBack: () => void;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ form, onBack }) => {
  const [responses, setResponses] = useState<FormResponse[]>([]);

  useEffect(() => {
    const data = storageService.getResponsesByFormIdLocal(form.id);
    // Sort by date descending
    setResponses(data.sort((a, b) => b.submittedAt - a.submittedAt));
  }, [form.id]);

  const downloadCSV = () => {
    // 1. Headers: Submission Date + All Fields
    const headers = ['Fecha Envío', ...form.fields.map(f => f.label.replace(/,/g, ''))]; // Remove commas to avoid CSV break
    
    // 2. Rows
    const rows = responses.map(r => {
      const date = new Date(r.submittedAt).toLocaleString();
      const answerCells = form.fields.map(f => {
        let val = r.answers[f.id];
        if (f.type === FieldType.IMAGE_UPLOAD && val) {
            return '[Imagen Adjunta]'; // Don't put massive base64 in CSV
        }
        if (val === null || val === undefined) return '';
        // Escape quotes and wrap in quotes for CSV safety
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [date, ...answerCells].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // 3. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${form.title.replace(/\s+/g, '_')}_respuestas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-full text-gray-600 transition-colors shadow-sm border border-transparent hover:border-gray-200">
              <ArrowLeftIcon />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Respuestas: {form.title}</h2>
              <p className="text-gray-500 text-sm">Total recibidas: {responses.length}</p>
            </div>
          </div>
          
          <button 
            onClick={downloadCSV}
            disabled={responses.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Descargar CSV (Excel/Sheets)</span>
          </button>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                  {form.fields.map(field => (
                    <th key={field.id} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[150px]">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {responses.length === 0 ? (
                   <tr>
                     <td colSpan={form.fields.length + 1} className="px-6 py-12 text-center text-gray-400 italic">
                       Aún no hay respuestas para este formulario.
                     </td>
                   </tr>
                ) : (
                  responses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(response.submittedAt).toLocaleString()}
                      </td>
                      {form.fields.map(field => (
                        <td key={field.id} className="px-6 py-4 text-sm text-gray-800">
                          {field.type === FieldType.IMAGE_UPLOAD && response.answers[field.id] ? (
                            <div className="relative group w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                                <img 
                                    src={response.answers[field.id] as string} 
                                    alt="User Upload" 
                                    className="w-full h-full object-cover" 
                                />
                                <a 
                                    href={response.answers[field.id] as string} 
                                    download={`upload_${field.id}.png`}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                </a>
                            </div>
                          ) : (
                            <span className="line-clamp-2">{response.answers[field.id] || '-'}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};