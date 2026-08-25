import React from 'react';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';

export default function LogTable({ logs, page, totalPages, onPageChange, onRollback }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border-2 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-slate-50 border-b text-slate-400 font-black uppercase tracking-tighter">
              <tr>
                <th className="p-5">TIMESTAMP</th>
                <th className="p-5">ACTIVITY LOG</th>
                <th className="p-5 text-center">롤백</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr><td colSpan="3" className="p-12 text-center text-slate-300 italic font-black">표시할 로그가 없습니다.</td></tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 animate-in fade-in transition-colors group">
                    <td className="p-5 text-slate-400 font-medium whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                      <span className="mx-1 text-[8px] opacity-30">/</span> 
                      {new Date(l.timestamp).toLocaleDateString([], {month:'short', day:'numeric'})}
                    </td>
                    <td className="p-5 font-bold text-slate-700">{l.details}</td>
                    <td className="p-5 text-center w-16">
                      {l.rollbackData && !l.rollbackData.restored && (
                        <button 
                          onClick={() => onRollback(l.id, l.rollbackData)} 
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-teal-50 text-teal-600 border border-teal-200 p-1.5 rounded-lg hover:bg-teal-100 flex items-center justify-center mx-auto"
                          title="복구"
                        >
                          <History size={14}/>
                        </button>
                      )}
                      {l.rollbackData?.restored && (
                        <span className="text-[10px] font-black text-slate-300 italic">복원됨</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center px-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => onPageChange(page - 1)} className="p-2 bg-white border-2 rounded-xl disabled:opacity-20 hover:bg-slate-50/50 transition-colors shadow-sm"><ChevronLeft size={16}/></button>
            <button disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="p-2 bg-white border-2 rounded-xl disabled:opacity-20 hover:bg-slate-50/50 transition-colors shadow-sm"><ChevronRight size={16}/></button>
          </div>
        </div>
      )}
    </div>
  );
}
