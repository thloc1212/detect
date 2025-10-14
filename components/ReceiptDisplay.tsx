
import React from 'react';
import { Receipt } from '../types';

interface ReceiptDisplayProps {
  receipt: Receipt;
  imagePreviewUrl: string;
  onReset: () => void;
}

const InfoCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className = ''}) => (
    <div className="bg-slate-50 p-4 rounded-lg">
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className={`text-slate-800 font-semibold ${className}`}>{value}</p>
    </div>
)

export const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ receipt, imagePreviewUrl, onReset }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };
    
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
      <div className="flex flex-col">
        <div className="relative aspect-[3/4] w-full bg-slate-100 rounded-xl overflow-hidden shadow-inner border">
            <img 
                src={imagePreviewUrl} 
                alt="Receipt Preview" 
                className="w-full h-full object-contain"
            />
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">{receipt.storeName}</h2>
            </div>
            <button
                onClick={onReset}
                className="text-sm bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors"
            >
                Scan New
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoCard label="Date" value={formatDate(receipt.transactionDate)} />
            <InfoCard 
                label="Total" 
                value={`$${receipt.total.toFixed(2)}`}
                className="text-2xl text-indigo-600"
            />
        </div>

        <h3 className="text-xl font-semibold text-slate-700 mb-3">Purchased Items</h3>
        <div className="flex-grow bg-slate-50 rounded-lg border border-slate-200/80 overflow-y-auto max-h-[400px]">
            <ul className="divide-y divide-slate-200">
                {receipt.items.length > 0 ? (
                    receipt.items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-4 hover:bg-slate-100 transition-colors">
                            <div className="flex-1">
                                <p className="font-medium text-slate-800 capitalize">{item.name}</p>
                                <p className="text-sm text-slate-500">
                                    {item.quantity > 1 ? `Qty: ${item.quantity}` : 'Single Item'}
                                </p>
                            </div>
                            <p className="text-right font-semibold text-slate-700">
                                ${item.price.toFixed(2)}
                            </p>
                        </li>
                    ))
                ) : (
                    <li className="p-4 text-center text-slate-500">No items were extracted.</li>
                )}
            </ul>
        </div>
      </div>
    </div>
  );
};
   