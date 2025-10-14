
import React, { useState, useCallback } from 'react';
import { Receipt } from './types';
import { parseReceipt } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { ReceiptDisplay } from './components/ReceiptDisplay';
import { Spinner } from './components/Spinner';

function App() {
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setReceiptData(null);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    try {
      const base64Image = await fileToBase64(file);
      const data = await parseReceipt(base64Image, file.type);
      setReceiptData(data);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      setImagePreview(null); // Clear preview on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setReceiptData(null);
    setImagePreview(null);
    setError(null);
    setIsLoading(false);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-8">
          <Spinner />
          <p className="text-lg text-slate-600 mt-4 font-medium animate-pulse">
            Analyzing your receipt...
          </p>
          <p className="text-sm text-slate-500 mt-1">
            This might take a few moments.
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-semibold text-red-700">Oops! Something went wrong.</h3>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={handleReset}
            className="mt-6 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    if (receiptData && imagePreview) {
      return (
        <ReceiptDisplay
          receipt={receiptData}
          imagePreviewUrl={imagePreview}
          onReset={handleReset}
        />
      );
    }

    return <FileUpload onFileUpload={handleFileUpload} isLoading={isLoading} />;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 tracking-tight">
            AI Receipt Scanner
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
            Upload an image of your receipt and let our AI instantly extract the details for you.
          </p>
        </header>
        <main className="bg-white rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden">
          {renderContent()}
        </main>
        <footer className="text-center mt-8 text-slate-500 text-sm">
            <p>Powered by Google Gemini</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
   