import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import { Download, Scissors, X, Check, Eye, FileText, MousePointerClick, Save, Maximize, ArrowLeft, Move, Minimize2, Settings, Type, Image as ImageIcon, Calendar, Grid } from 'lucide-react';
import { EPaperPage, CropRegion, UserRole } from '../../types';
import { MOCK_ARTICLES, MOCK_SETTINGS } from '../../services/mockData';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

interface EPaperViewerProps {
  pages: EPaperPage[];
}

export const EPaperViewer: React.FC<EPaperViewerProps> = ({ pages }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  const pageId = searchParams.get('pageId');
  
  const availableDates = useMemo(() => {
    const dates = [...new Set(pages.map(p => p.date))];
    return dates.sort().reverse();
  }, [pages]);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDates.length > 0 ? availableDates[0] : new Date().toISOString().split('T')[0];
  });

  const editionPages = useMemo(() => {
    return pages
      .filter(p => p.date === selectedDate)
      .sort((a,b) => a.pageNumber - b.pageNumber);
  }, [pages, selectedDate]);

  const activePage = useMemo(() => {
    return pages.find(p => p.id === pageId) || null;
  }, [pages, pageId]);

  const [viewMode, setViewMode] = useState<'READ' | 'EDIT'>('READ');
  const [selectedRegion, setSelectedRegion] = useState<CropRegion | null>(null);
  const [generatedClip, setGeneratedClip] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropperDragMode, setCropperDragMode] = useState<'move' | 'none'>('none');
  const [newRegionData, setNewRegionData] = useState<{title: string, articleId: string}>({ title: '', articleId: '' });

  const wmText = MOCK_SETTINGS.watermark.text;
  const wmImgUrl = MOCK_SETTINGS.watermark.imageUrl;
  const wmScale = MOCK_SETTINGS.watermark.scale;
  const wmShowDate = MOCK_SETTINGS.watermark.showDate;
  
  const cropperRef = useRef<ReactCropperElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const isEditor = user && [UserRole.ADMIN, UserRole.EDITOR, UserRole.PUBLISHER].includes(user.role);
  
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const generateWatermarkedImage = async (sourceImage: HTMLImageElement, x: number, y: number, w: number, h: number): Promise<string> => {
    const scale = wmScale || 1.5;
    const footerHeight = 70 * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h + footerHeight; 

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      ctx.drawImage(sourceImage, x, y, w, h, 0, 0, w, h);
    } catch (e) {
      console.error("Canvas draw error", e);
      return '';
    }

    ctx.fillStyle = '#111827'; 
    ctx.fillRect(0, h, canvas.width, footerHeight);

    const padding = 25 * scale;
    const textY = h + (40 * scale);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${18 * scale}px "Playfair Display", serif`;
    ctx.fillText(wmText || "CJNEWS HUB", padding, textY);

    if (wmShowDate) {
        ctx.font = `${14 * scale}px sans-serif`;
        ctx.fillStyle = '#94a3b8';
        const dateText = `CLIPPED FROM THE EDITION OF ${activePage?.date}`;
        const dateWidth = ctx.measureText(dateText).width;
        ctx.fillText(dateText, canvas.width - dateWidth - padding, textY);
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleRegionClick = async (region: CropRegion) => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const x = (region.x / 100) * naturalWidth;
    const y = (region.y / 100) * naturalHeight;
    const w = (region.width / 100) * naturalWidth;
    const h = (region.height / 100) * naturalHeight;

    const clipUrl = await generateWatermarkedImage(img, x, y, w, h);
    if (clipUrl) {
      setGeneratedClip(clipUrl);
      setSelectedRegion(region);
    }
  };

  const handleManualCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      const canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: 'high' });
      if (!canvas) return;
      
      const tempImg = new Image();
      tempImg.onload = async () => {
          const clipUrl = await generateWatermarkedImage(tempImg, 0, 0, tempImg.width, tempImg.height);
          if (clipUrl) {
             setGeneratedClip(clipUrl);
             setSelectedRegion({ id: 'temp', title: 'User Clip', x:0, y:0, width:0, height:0 });
             setIsCropping(false);
          }
      };
      tempImg.src = canvas.toDataURL();
    }
  };

  if (!activePage) {
    return (
      <div className="space-y-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Grid size={24} className="text-[#b4a070]" />
              Digital Editions
            </h3>
            <input 
               type="date"
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#b4a070]"
             />
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {editionPages.map((page) => (
               <div 
                 key={page.id}
                 onClick={() => navigate(`/epaper?pageId=${page.id}`)}
                 className="group cursor-pointer bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-xl transition-all"
               >
                  <div className="aspect-[3/4] relative overflow-hidden">
                     <img src={page.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-sm">Read Page {page.pageNumber}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
        <button onClick={() => navigate('/epaper')} className="flex items-center gap-2 text-gray-500 hover:text-black font-bold text-sm">
           <ArrowLeft size={18} /> BACK TO EDITIONS
        </button>
        <div className="flex gap-2">
          {isEditor && (
            <button onClick={() => setViewMode(viewMode === 'READ' ? 'EDIT' : 'READ')} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg text-gray-700">
               <Settings size={20} />
            </button>
          )}
          <button onClick={() => setIsCropping(true)} className="bg-[#b4a070] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
            <Scissors size={18} /> CLIP ARTICLE
          </button>
        </div>
      </div>

      <div className="bg-slate-200 p-8 rounded-xl flex justify-center shadow-inner relative min-h-[70vh]">
         <div className="relative shadow-2xl bg-white max-w-full">
            <img 
              ref={imageRef}
              src={activePage.imageUrl} 
              className="max-h-[85vh] w-auto block"
              crossOrigin="anonymous"
            />
            {viewMode === 'READ' && activePage.regions?.map((region) => (
               <div
                 key={region.id}
                 onClick={() => handleRegionClick(region)}
                 className="absolute border-2 border-transparent hover:border-[#b4a070] hover:bg-[#b4a070]/10 cursor-pointer transition-all"
                 style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }}
               />
            ))}
         </div>
      </div>

      {isCropping && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
          <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center text-white">
            <button onClick={() => setIsCropping(false)} className="flex items-center gap-2 text-zinc-400 hover:text-white">
               <ArrowLeft size={20} /> Cancel
            </button>
            <div className="flex gap-4">
               <button onClick={() => setCropperDragMode('none')} className={`p-2 rounded ${cropperDragMode === 'none' ? 'bg-[#b4a070]' : 'bg-zinc-800'}`}><Minimize2 size={18} /></button>
               <button onClick={() => setCropperDragMode('move')} className={`p-2 rounded ${cropperDragMode === 'move' ? 'bg-[#b4a070]' : 'bg-zinc-800'}`}><Move size={18} /></button>
            </div>
            <button onClick={handleManualCrop} className="bg-white text-black px-6 py-2 rounded-full font-bold">CROP & WATERMARK</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Cropper
               src={activePage.imageUrl}
               style={{ height: '100%', width: '100%' }}
               ref={cropperRef}
               dragMode={cropperDragMode}
               viewMode={1}
               crossOrigin="anonymous"
               background={false}
            />
          </div>
        </div>
      )}

      {selectedRegion && generatedClip && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
               <h3 className="font-bold text-gray-800">Preview & Download</h3>
               <button onClick={() => { setSelectedRegion(null); setGeneratedClip(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 p-8 bg-gray-100 overflow-y-auto flex justify-center">
               <img src={generatedClip} className="shadow-xl max-h-[60vh] object-contain" />
            </div>
            <div className="p-6 border-t flex justify-end gap-4">
               <a href={generatedClip} download="news_clip.jpg" className="bg-black text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                  <Download size={20} /> Download Clip
               </a>
               {selectedRegion.linkedArticleId && (
                  <button onClick={() => navigate(`/articles/${selectedRegion.linkedArticleId}`)} className="bg-[#b4a070] text-white px-8 py-3 rounded-xl font-bold">Read Full Article</button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};