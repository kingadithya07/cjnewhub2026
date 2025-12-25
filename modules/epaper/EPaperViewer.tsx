
import React, { useState, useRef, useMemo } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import { Download, Scissors, X, ArrowLeft, Move, Minimize2, Settings, Grid } from 'lucide-react';
import { EPaperPage, CropRegion, UserRole } from '../../types';
import { MOCK_SETTINGS } from '../../services/mockData';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface EPaperViewerProps {
  pages: EPaperPage[];
}

export const EPaperViewer: React.FC<EPaperViewerProps> = ({ pages }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pageId = searchParams.get('pageId');
  
  const availableDates = useMemo(() => {
    const dates = [...new Set(pages.map(p => p.date))];
    return dates.sort().reverse();
  }, [pages]);

  const [selectedDate, setSelectedDate] = useState<string>(availableDates[0] || "");
  const [isCropping, setIsCropping] = useState(false);
  const [generatedClip, setGeneratedClip] = useState<string | null>(null);
  const [cropperDragMode, setCropperDragMode] = useState<'move' | 'none'>('none');

  const cropperRef = useRef<ReactCropperElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const activePage = useMemo(() => pages.find(p => p.id === pageId) || null, [pages, pageId]);
  const editionPages = useMemo(() => pages.filter(p => p.date === selectedDate).sort((a,b) => a.pageNumber - b.pageNumber), [pages, selectedDate]);

  const generateWatermarkedImage = async (sourceImage: HTMLImageElement | HTMLCanvasElement, x: number, y: number, w: number, h: number): Promise<string> => {
    const scale = 2; // High-res scaling
    const footerHeight = 60 * scale;
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = (h * scale) + footerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw Article
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (sourceImage instanceof HTMLImageElement) {
        ctx.drawImage(sourceImage, x, y, w, h, 0, 0, w * scale, h * scale);
    } else {
        ctx.drawImage(sourceImage, 0, 0, sourceImage.width, sourceImage.height, 0, 0, w * scale, h * scale);
    }

    // Draw Watermark Footer
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, h * scale, canvas.width, footerHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${16 * scale}px "Playfair Display", serif`;
    ctx.fillText(MOCK_SETTINGS.watermark.text.toUpperCase(), 20 * scale, (h * scale) + (35 * scale));

    ctx.fillStyle = '#94a3b8';
    ctx.font = `${10 * scale}px sans-serif`;
    const dateText = `EDITION: ${activePage?.date} | CLIPPED BY NEWSFLOW HUB`;
    const textWidth = ctx.measureText(dateText).width;
    ctx.fillText(dateText, canvas.width - textWidth - (20 * scale), (h * scale) + (35 * scale));

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleRegionClick = async (region: CropRegion) => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const x = (region.x / 100) * nw, y = (region.y / 100) * nh;
    const w = (region.width / 100) * nw, h = (region.height / 100) * nh;

    const clip = await generateWatermarkedImage(img, x, y, w, h);
    setGeneratedClip(clip);
  };

  const handleManualCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const canvas = cropper.getCroppedCanvas();
      const clip = await generateWatermarkedImage(canvas, 0, 0, canvas.width, canvas.height);
      setGeneratedClip(clip);
      setIsCropping(false);
    }
  };

  if (!activePage) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-black flex items-center gap-3" style={{ fontFamily: '"Playfair Display", serif' }}>
            <Grid className="text-[#b4a070]" /> DIGITAL EDITIONS
          </h2>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="border p-2 rounded-xl outline-none" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {editionPages.map(p => (
            <div key={p.id} onClick={() => navigate(`/epaper?pageId=${p.id}`)} className="group cursor-pointer bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-xl transition-all">
              <img src={p.imageUrl} className="aspect-[3/4] object-cover group-hover:scale-105 transition-transform" />
              <div className="p-3 text-center font-bold text-xs uppercase tracking-widest text-gray-500">Page {p.pageNumber}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-gray-100">
        <button onClick={() => navigate('/epaper')} className="flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft size={18} /> BACK</button>
        <div className="flex gap-2">
          <button onClick={() => setIsCropping(true)} className="bg-[#b4a070] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm"><Scissors size={18} /> CUSTOM CLIP</button>
        </div>
      </div>

      <div className="relative bg-slate-200 p-4 md:p-12 rounded-2xl flex justify-center min-h-[70vh] shadow-inner">
        <div className="relative shadow-2xl bg-white">
            <img ref={imageRef} src={activePage.imageUrl} className="max-h-[85vh] w-auto block" crossOrigin="anonymous" />
            {activePage.regions?.map(r => (
               <div key={r.id} onClick={() => handleRegionClick(r)} className="absolute border-2 border-transparent hover:border-[#b4a070] hover:bg-[#b4a070]/10 cursor-pointer transition-all" style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.width}%`, height: `${r.height}%` }} />
            ))}
        </div>
      </div>

      {isCropping && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="bg-zinc-900 p-4 flex justify-between items-center text-white border-b border-zinc-800">
            <button onClick={() => setIsCropping(false)} className="text-zinc-400 hover:text-white flex items-center gap-2"><ArrowLeft size={20} /> Cancel</button>
            <div className="flex gap-4">
               <button onClick={() => setCropperDragMode('none')} className={`p-2 rounded ${cropperDragMode === 'none' ? 'bg-[#b4a070]' : 'bg-zinc-800'}`}><Minimize2 size={18} /></button>
               <button onClick={() => setCropperDragMode('move')} className={`p-2 rounded ${cropperDragMode === 'move' ? 'bg-[#b4a070]' : 'bg-zinc-800'}`}><Move size={18} /></button>
            </div>
            <button onClick={handleManualCrop} className="bg-white text-black px-6 py-2 rounded-full font-bold">GENERATE CLIP</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Cropper src={activePage.imageUrl} style={{ height: '100%', width: '100%' }} ref={cropperRef} dragMode={cropperDragMode} viewMode={1} crossOrigin="anonymous" background={false} />
          </div>
        </div>
      )}

      {generatedClip && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <span className="font-bold text-gray-500 text-xs uppercase tracking-widest">Clip Preview</span>
              <button onClick={() => setGeneratedClip(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 p-8 bg-gray-50 flex justify-center items-center overflow-y-auto">
               <img src={generatedClip} className="shadow-2xl max-h-[60vh] object-contain border-4 border-white" />
            </div>
            <div className="p-6 flex justify-end">
              <a href={generatedClip} download={`newsflow_clip_${Date.now()}.jpg`} className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                <Download size={20} /> Download for Sharing
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
