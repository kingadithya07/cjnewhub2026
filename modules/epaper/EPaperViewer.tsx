
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import { Download, Scissors, X, Check, Eye, FileText, MousePointerClick, Save, Maximize, ArrowLeft, Move, Minimize2, Settings, Type, Image as ImageIcon, Calendar, Grid, Share2 } from 'lucide-react';
import { EPaperPage, CropRegion, UserRole } from '../../types';
import { MOCK_SETTINGS } from '../../services/mockData';
// Fix: Standard v6 imports
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
  const [cropperDragMode, setCropperDragMode] = useState<'none' | 'move'>('none');
  
  const wmText = MOCK_SETTINGS.watermark.text;
  const wmShowDate = MOCK_SETTINGS.watermark.showDate;
  
  const cropperRef = useRef<ReactCropperElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Fix: Handle dragMode change via instance method to avoid TS prop errors
  useEffect(() => {
    if (cropperRef.current?.cropper) {
      cropperRef.current.cropper.setDragMode(cropperDragMode);
    }
  }, [cropperDragMode]);

  const isEditor = user && [UserRole.ADMIN, UserRole.EDITOR, UserRole.PUBLISHER].includes(user.role);

  const generateWatermarkedImage = async (sourceImage: HTMLImageElement, x: number, y: number, w: number, h: number): Promise<string> => {
    const footerHeight = 120;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h + footerHeight; 

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the crop
    try {
      ctx.drawImage(sourceImage, x, y, w, h, 0, 0, w, h);
    } catch (e) {
      console.error("Canvas draw error", e);
      return '';
    }

    // Add Repeating Watermark Pattern on top of image
    ctx.save();
    ctx.translate(w/2, h/2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(180, 160, 112, 0.15)'; // Subtle Gold
    ctx.font = 'bold 24px sans-serif';
    
    const stepX = 200;
    const stepY = 100;
    for (let i = -w; i < w; i += stepX) {
      for (let j = -h; j < h; j += stepY) {
        ctx.fillText(wmText || "CJNEWS HUB", i, j);
      }
    }
    ctx.restore();

    // Black footer
    ctx.fillStyle = '#000000'; 
    ctx.fillRect(0, h, canvas.width, footerHeight);

    const padding = 40;
    const textY = h + 70;
    
    // Watermark Logo/Text
    ctx.fillStyle = '#b4a070';
    ctx.font = 'bold 32px "Playfair Display", serif';
    ctx.fillText(wmText || "CJNEWS HUB", padding, textY);

    if (wmShowDate) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#ffffff';
        const dateText = `EDITION: ${activePage?.date || selectedDate} | PAGE: ${activePage?.pageNumber || 'CLIP'}`;
        const dateWidth = ctx.measureText(dateText).width;
        ctx.fillText(dateText, canvas.width - dateWidth - padding, textY);
    }

    // Small attribution
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px sans-serif';
    ctx.fillText('CLIPPED VIA NEWSFLOW DIGITAL SERVICES • PROOF OF AUTHENTICITY', padding, textY + 30);

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
      <div className="space-y-6 animate-in fade-in duration-500">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                 <Grid size={24} className="text-[#b4a070]" />
                 Digital Archives
               </h3>
               <p className="text-sm text-gray-500">Select an edition to start reading</p>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
               <Calendar size={18} className="text-gray-400" />
               <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-gray-800 text-sm font-bold outline-none"
                />
            </div>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {editionPages.map((page) => (
               <div 
                 key={page.id}
                 onClick={() => navigate(`/epaper?pageId=${page.id}`)}
                 className="group cursor-pointer flex flex-col gap-2"
               >
                  <div className="aspect-[3/4] relative overflow-hidden rounded-xl shadow-md group-hover:shadow-2xl transition-all border border-gray-200">
                     <img src={page.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity p-4 text-center">
                        <span className="bg-[#b4a070] text-black px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-2">Read Edition</span>
                        <p className="text-white text-[10px] font-bold">PAGE {page.pageNumber}</p>
                     </div>
                  </div>
                  <div className="px-1">
                     <p className="font-bold text-gray-800 text-sm">Page {page.pageNumber}</p>
                     <p className="text-xs text-gray-400 uppercase tracking-tighter">{new Date(page.date).toLocaleDateString()}</p>
                  </div>
               </div>
            ))}
            {editionPages.length === 0 && (
               <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 font-bold">
                  No editions found for this date.
               </div>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center sticky top-14 md:top-28 z-30">
        <button onClick={() => navigate('/epaper')} className="flex items-center gap-2 text-gray-500 hover:text-black font-bold text-sm transition-colors">
           <ArrowLeft size={18} /> <span className="hidden sm:inline">BACK TO EDITIONS</span>
        </button>
        <div className="flex gap-2">
          {isEditor && (
            <button onClick={() => setViewMode(viewMode === 'READ' ? 'EDIT' : 'READ')} className={`p-2 rounded-lg transition-colors ${viewMode === 'EDIT' ? 'bg-[#b4a070] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
               <Settings size={20} />
            </button>
          )}
          <button onClick={() => setIsCropping(true)} className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-900 transition-colors shadow-lg">
            <Scissors size={18} className="text-[#b4a070]" /> CLIP & SHARE
          </button>
        </div>
      </div>

      <div className="bg-slate-800 p-4 md:p-12 rounded-2xl flex justify-center shadow-inner relative min-h-[80vh] overflow-hidden">
         <div className="relative shadow-2xl bg-white max-w-full h-fit border-[12px] border-white rounded-sm overflow-hidden">
            <img 
              ref={imageRef}
              src={activePage.imageUrl} 
              className="max-h-[90vh] md:max-h-[120vh] w-auto block"
              crossOrigin="anonymous"
            />
            {viewMode === 'READ' && activePage.regions?.map((region) => (
               <div
                 key={region.id}
                 onClick={() => handleRegionClick(region)}
                 className="absolute border-2 border-transparent hover:border-[#b4a070] hover:bg-[#b4a070]/5 cursor-pointer transition-all group"
                 style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%` }}
               >
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <div className="bg-[#b4a070] text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-widest">{region.title}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {isCropping && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
          <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center text-white">
            <button onClick={() => setIsCropping(false)} className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold">
               <X size={24} /> Close
            </button>
            <div className="flex gap-4">
               <button onClick={() => setCropperDragMode('none')} className={`p-2 rounded-lg transition-colors ${cropperDragMode === 'none' ? 'bg-[#b4a070] text-black' : 'bg-zinc-800 text-zinc-400'}`}><Minimize2 size={20} /></button>
               <button onClick={() => setCropperDragMode('move')} className={`p-2 rounded-lg transition-colors ${cropperDragMode === 'move' ? 'bg-[#b4a070] text-black' : 'bg-zinc-800 text-zinc-400'}`}><Move size={20} /></button>
            </div>
            <button onClick={handleManualCrop} className="bg-white text-black px-6 py-2 rounded-full font-bold shadow-xl active:scale-95 transition-transform">WATERMARK CLIP</button>
          </div>
          <div className="flex-1 overflow-hidden bg-black/50">
            <Cropper
               src={activePage.imageUrl}
               style={{ height: '100%', width: '100%' }}
               ref={cropperRef}
               viewMode={1}
               guides={true}
               responsive={true}
               checkOrientation={false}
               crossOrigin="anonymous"
               background={false}
            />
          </div>
        </div>
      )}

      {selectedRegion && generatedClip && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-10 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[90vh]">
            <div className="flex-1 bg-gray-200 flex items-center justify-center p-4 overflow-hidden">
               <img src={generatedClip} className="max-h-full max-w-full shadow-2xl object-contain rounded" />
            </div>
            <div className="w-full md:w-80 p-8 flex flex-col border-l border-gray-100 bg-white">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-900" style={{ fontFamily: '"Playfair Display", serif' }}>PREVIEW</h3>
                  <button onClick={() => { setSelectedRegion(null); setGeneratedClip(null); }} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
               </div>
               
               <div className="space-y-6 flex-1">
                  <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Edition Details</p>
                     <p className="text-sm font-bold text-gray-800">{activePage.date}</p>
                     <p className="text-xs text-gray-500">Page {activePage.pageNumber}</p>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Clipper Logic</p>
                     <p className="text-xs text-gray-600 leading-relaxed">High-resolution clipping with CJNews Hub watermark and authenticity stamp.</p>
                  </div>
               </div>

               <div className="space-y-3 pt-6">
                  <a href={generatedClip} download={`news_clip_${activePage.date}.jpg`} className="w-full bg-[#111827] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg hover:bg-black transition-all active:scale-95">
                     <Download size={20} className="text-[#b4a070]" /> Download JPG
                  </a>
                  {selectedRegion.linkedArticleId && (
                     <button onClick={() => navigate(`/articles/${selectedRegion.linkedArticleId}`)} className="w-full bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                        <FileText size={20} className="text-[#b4a070]" /> Read Article
                     </button>
                  )}
                  <button className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-widest py-2 transition-colors">
                     <Share2 size={14} /> Social Share
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
