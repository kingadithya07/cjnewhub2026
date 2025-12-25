
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
  
  // URL State
  const pageId = searchParams.get('pageId');
  
  // -- Date Logic --
  // Get unique dates from pages or default to today
  const availableDates = useMemo(() => {
    const dates = [...new Set(pages.map(p => p.date))];
    return dates.sort().reverse();
  }, [pages]);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return availableDates.length > 0 ? availableDates[0] : new Date().toISOString().split('T')[0];
  });

  // Filter pages for the Grid View based on selected date
  const editionPages = useMemo(() => {
    return pages
      .filter(p => p.date === selectedDate)
      .sort((a,b) => a.pageNumber - b.pageNumber);
  }, [pages, selectedDate]);

  // -- Active Page Logic --
  // We find the active page directly from the full pool of pages using the URL ID
  const activePage = useMemo(() => {
    return pages.find(p => p.id === pageId) || null;
  }, [pages, pageId]);

  // Sync selectedDate when opening a specific page (so 'Back to Gallery' goes to the right context)
  useEffect(() => {
    if (activePage && activePage.date !== selectedDate) {
      setSelectedDate(activePage.date);
    }
  }, [activePage]); 

  // Local State
  const [viewMode, setViewMode] = useState<'READ' | 'EDIT'>('READ');
  
  // Interaction State
  const [selectedRegion, setSelectedRegion] = useState<CropRegion | null>(null);
  const [generatedClip, setGeneratedClip] = useState<string | null>(null);
  
  // Edit State
  const [isCropping, setIsCropping] = useState(false);
  const [cropperDragMode, setCropperDragMode] = useState<'move' | 'none'>('none');
  const [newRegionData, setNewRegionData] = useState<{title: string, articleId: string}>({ title: '', articleId: '' });

  // Watermark State - Initialize from Global Settings
  const [wmText, setWmText] = useState(MOCK_SETTINGS.watermark.text);
  const [wmImgUrl, setWmImgUrl] = useState(MOCK_SETTINGS.watermark.imageUrl);
  const [wmScale, setWmScale] = useState(MOCK_SETTINGS.watermark.scale);
  const [wmShowDate, setWmShowDate] = useState(MOCK_SETTINGS.watermark.showDate);
  
  // Refs
  const cropperRef = useRef<ReactCropperElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Permission Checks
  const isEditor = user && [UserRole.ADMIN, UserRole.EDITOR, UserRole.PUBLISHER].includes(user.role);
  
  // Reset states on page change
  useEffect(() => {
    setSelectedRegion(null);
    setGeneratedClip(null);
    setIsCropping(false);
  }, [pageId]);

  // Refresh settings when component mounts or updates
  useEffect(() => {
      setWmText(MOCK_SETTINGS.watermark.text);
      setWmImgUrl(MOCK_SETTINGS.watermark.imageUrl);
      setWmScale(MOCK_SETTINGS.watermark.scale);
      setWmShowDate(MOCK_SETTINGS.watermark.showDate);
  }, [isCropping]); // Refresh when opening cropper

  // --- Watermark Logic ---
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
    const scale = wmScale;
    const footerHeight = 60 * scale;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h + footerHeight; 

    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Draw White BG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Source Image Slice
    try {
      ctx.drawImage(sourceImage, x, y, w, h, 0, 0, w, h);
    } catch (e) {
      console.error("Error drawing image to canvas", e);
      return '';
    }

    // Footer Background
    ctx.fillStyle = '#1e1b4b'; 
    ctx.fillRect(0, h, canvas.width, footerHeight);

    // Footer Content
    const padding = 20 * scale;
    const textY = h + (35 * scale);
    
    // Draw Custom Image (Left) or Text (Left)
    if (wmImgUrl) {
      try {
        const logo = await loadImage(wmImgUrl);
        const logoH = footerHeight - (20 * scale); // 10px padding top/bottom roughly
        const logoW = logo.width * (logoH / logo.height);
        ctx.drawImage(logo, padding, h + (10 * scale), logoW, logoH);
      } catch (e) {
        // Fallback to text if image fails
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${16 * scale}px sans-serif`;
        ctx.fillText(wmText, padding, textY);
      }
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${16 * scale}px sans-serif`;
        ctx.fillText(wmText, padding, textY);
    }

    // Draw Date (Right)
    if (wmShowDate) {
        ctx.font = `${14 * scale}px sans-serif`;
        ctx.fillStyle = '#cbd5e1';
        const dateText = `Clipped on ${new Date().toLocaleDateString()}`;
        const dateWidth = ctx.measureText(dateText).width;
        ctx.fillText(dateText, canvas.width - dateWidth - padding, textY);
    }

    try {
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (e) {
      console.error("SecurityError: Canvas tainted.", e);
      alert("Cannot generate clip: The image server restricts access.");
      return '';
    }
  };

  // --- Handlers ---

  const handleStartCropping = () => {
    setIsCropping(true);
    setCropperDragMode('none'); // Freeze image by default
  };

  const onCropperReady = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
       cropper.reset();
       const container = cropper.getContainerData();
       const initialSize = 150;
       cropper.setCropBoxData({
         left: (container.width / 2) - (initialSize / 2),
         top: (container.height / 2) - (initialSize / 2),
         width: initialSize,
         height: initialSize
       });
    }
  };

  const handleRegionClick = async (region: CropRegion) => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    if (!img.complete) { alert("Please wait for image to load."); return; }

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
      let canvas: HTMLCanvasElement;
      try {
        canvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
      } catch (e) { console.error(e); return; }
      
      if (!canvas) return;
      
      const tempImg = new Image();
      tempImg.onload = async () => {
          const clipUrl = await generateWatermarkedImage(tempImg, 0, 0, tempImg.width, tempImg.height);
          if (clipUrl) {
             setGeneratedClip(clipUrl);
             setSelectedRegion({ id: 'temp', title: 'Manual Clip', x:0, y:0, width:0, height:0 });
             setIsCropping(false);
          }
      };
      tempImg.src = canvas.toDataURL();
    }
  };

  const handleSaveNewRegion = () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
       const data = cropper.getData();
       const imgData = cropper.getImageData();
       const naturalW = imgData.naturalWidth;
       const naturalH = imgData.naturalHeight;

       const newRegion: CropRegion = {
         id: `reg-${Date.now()}`,
         title: newRegionData.title || 'Untitled Region',
         x: (data.x / naturalW) * 100,
         y: (data.y / naturalH) * 100,
         width: (data.width / naturalW) * 100,
         height: (data.height / naturalH) * 100,
         linkedArticleId: newRegionData.articleId || undefined
       };

       // Update the local page object (in real app, this updates backend)
       if (!activePage!.regions) activePage!.regions = [];
       activePage!.regions!.push(newRegion);
       setIsCropping(false);
       setNewRegionData({ title: '', articleId: '' });
       alert('Region Saved!');
    }
  };

  const navigateToPage = (pageId: string) => {
    navigate(`/epaper?pageId=${pageId}`);
  };

  // --- GRID VIEW RENDER ---
  if (!activePage) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Grid size={24} />
              E-Paper Edition
            </h3>
            
            {/* Date Selector */}
            <div className="flex items-center space-x-2 w-full md:w-auto">
               <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Select Date:</span>
               <div className="relative flex-1 md:flex-none">
                 <input 
                   type="date"
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="w-full md:w-auto bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none"
                 />
                 <Calendar className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
               </div>
            </div>
         </div>
         
         {/* Responsive Grid: 3 cols (mobile), 4 cols (tablet), 6 cols (desktop) */}
         {editionPages.length > 0 ? (
           <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-6">
              {editionPages.map((page) => (
                 <div 
                   key={page.id}
                   onClick={() => navigateToPage(page.id)}
                   className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col"
                 >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                       <img 
                         src={page.imageUrl} 
                         alt={`Page ${page.pageNumber}`} 
                         className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                       />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-white text-indigo-900 px-4 py-2 rounded-full font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2">
                             <Eye size={16} /> 
                          </span>
                       </div>
                    </div>
                    {/* Compact Footer for Mobile Grid */}
                    <div className="p-2 md:p-4 bg-white border-t border-gray-100">
                       <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-800 text-xs md:text-lg">Page {page.pageNumber}</span>
                          <span className="text-xs text-gray-500 hidden sm:flex items-center gap-1">
                             <Calendar size={12} /> {page.date}
                          </span>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
         ) : (
           <div className="text-center py-20 bg-gray-100 rounded-xl border border-dashed border-gray-300">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No E-Paper pages found for {selectedDate}</p>
              <p className="text-xs text-gray-400 mt-1">Try selecting a different date</p>
           </div>
         )}
      </div>
    );
  }

  // --- READER / EDITOR VIEW RENDER ---
  return (
    <div className="h-full flex flex-col space-y-4 animate-in slide-in-from-right duration-300">
      
      {/* --- Main Toolbar (Top) --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-4">
           {/* Back to Grid Button */}
           <button 
             onClick={() => navigate('/epaper')}
             className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors flex items-center gap-2"
             title="Back to Gallery"
           >
              <Grid size={20} />
              <span className="hidden sm:inline font-medium">Gallery</span>
           </button>

           <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

           <div className="flex flex-col md:flex-row md:items-center md:gap-3">
             <span className="text-gray-900 font-bold text-lg">Page {activePage.pageNumber}</span>
             <span className="text-gray-500 text-xs md:text-sm flex items-center gap-1">
                <Calendar size={14} className="hidden md:block"/> {activePage.date}
             </span>
           </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Editor Mode Toggle */}
          {isEditor && (
            <div className="flex bg-gray-100 p-1 rounded-lg mr-4">
              <button 
                onClick={() => { setViewMode('READ'); setIsCropping(false); }}
                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center space-x-2 ${viewMode === 'READ' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}
              >
                <Eye size={16} /> <span className="hidden sm:inline">Read</span>
              </button>
              <button 
                onClick={() => setViewMode('EDIT')}
                className={`px-3 py-1.5 rounded text-sm font-medium flex items-center space-x-2 ${viewMode === 'EDIT' ? 'bg-white shadow text-indigo-700' : 'text-gray-500'}`}
              >
                <Scissors size={16} /> <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          )}

          {/* Add Clip Button - Only for Admins in Edit Mode */}
          {!isCropping && isEditor && viewMode === 'EDIT' && (
             <button 
              onClick={handleStartCropping} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow"
             >
               <Scissors size={18} /> <span>Add Linked Region</span>
             </button>
          )}
        </div>
      </div>

      {/* --- Main Viewer Content --- */}
      <div className="flex-1 bg-gray-200 rounded-xl overflow-hidden relative flex justify-center items-start p-4 min-h-[600px] shadow-inner">
          
          <div className="relative shadow-2xl h-full inline-block">
               <img 
                 ref={imageRef}
                 src={activePage.imageUrl} 
                 alt={`Page ${activePage.pageNumber}`} 
                 className="h-full w-auto max-h-[85vh] block bg-white object-contain"
                 crossOrigin="anonymous"
               />
             
             {viewMode === 'READ' && activePage.regions?.map((region) => (
               <div
                 key={region.id}
                 onClick={() => handleRegionClick(region)}
                 className="absolute border-2 border-indigo-500/0 hover:border-indigo-500 bg-indigo-500/0 hover:bg-indigo-500/10 cursor-pointer transition-all duration-200 group"
                 style={{
                   left: `${region.x}%`,
                   top: `${region.y}%`,
                   width: `${region.width}%`,
                   height: `${region.height}%`,
                 }}
               >
                 <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded shadow-lg whitespace-nowrap z-10 pointer-events-none transition-opacity">
                    {region.title}
                    {region.linkedArticleId && <span className="ml-2 text-indigo-300">(Read Article)</span>}
                 </div>
               </div>
             ))}
          </div>
      </div>

      {/* --- FULL SCREEN CROPPER OVERLAY --- */}
      {isCropping && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-in fade-in duration-200">
          
          {/* Cropper Toolbar */}
          <div className="bg-gray-900 text-white p-4 flex flex-wrap gap-4 justify-between items-center z-50 border-b border-gray-800">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setIsCropping(false)} 
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} className="mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </button>
              
              <div className="flex bg-gray-800 rounded-lg p-1">
                 <button 
                   onClick={() => setCropperDragMode('none')}
                   className={`px-3 py-1 rounded text-sm font-medium flex items-center space-x-2 transition-colors ${cropperDragMode === 'none' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                   title="Freeze image to resize clip easily"
                 >
                   <Minimize2 size={16} />
                   <span className="hidden sm:inline">Adjust</span>
                 </button>
                 <button 
                   onClick={() => setCropperDragMode('move')}
                   className={`px-3 py-1 rounded text-sm font-medium flex items-center space-x-2 transition-colors ${cropperDragMode === 'move' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                   title="Drag to move the page"
                 >
                   <Move size={16} />
                   <span className="hidden sm:inline">Move</span>
                 </button>
              </div>

              {/* Note: In-place settings toggle removed in favor of global Dashboard settings, but we keep the read-only display or just hide it to avoid confusion */}
            </div>

            <div className="flex items-center space-x-4">
              {viewMode === 'READ' ? (
                 <button onClick={handleManualCrop} className="bg-white hover:bg-gray-100 text-indigo-900 px-6 py-2 rounded-full font-bold flex items-center shadow-lg transition-colors">
                   <Check size={20} className="mr-2" /> Clip It
                 </button>
              ) : (
                <div className="flex items-center space-x-2">
                   <input 
                     type="text" placeholder="Region Title" 
                     className="bg-gray-800 border-gray-700 text-white rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-32 md:w-48"
                     value={newRegionData.title}
                     onChange={e => setNewRegionData({...newRegionData, title: e.target.value})}
                   />
                   <select 
                     className="bg-gray-800 border-gray-700 text-white rounded px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-24 md:w-40"
                     value={newRegionData.articleId}
                     onChange={e => setNewRegionData({...newRegionData, articleId: e.target.value})}
                   >
                     <option value="">No Link</option>
                     {MOCK_ARTICLES.map(a => <option key={a.id} value={a.id}>{a.title.substring(0, 15)}...</option>)}
                   </select>
                   <button onClick={handleSaveNewRegion} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold flex items-center">
                     <Save size={18} className="mr-2" /> Save
                   </button>
                </div>
              )}
            </div>
          </div>

          {/* Full Screen Cropper Area - Constrained on Desktop */}
          <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden">
             <div className="w-full h-full md:max-w-6xl md:max-h-[85vh] bg-black shadow-2xl rounded-lg overflow-hidden border border-gray-800">
                <Cropper
                  src={activePage.imageUrl}
                  style={{ height: '100%', width: '100%' }}
                  initialAspectRatio={NaN}
                  guides={true}
                  ref={cropperRef}
                  viewMode={1}
                  dragMode={cropperDragMode} 
                  responsive={true}
                  crossOrigin="anonymous"
                  background={false}
                  className="cropper-full-height"
                  toggleDragModeOnDblclick={false}
                  ready={onCropperReady} 
                />
             </div>
          </div>
          
          <div className="bg-gray-900 text-gray-400 text-xs text-center py-2 border-t border-gray-800">
             {cropperDragMode === 'none' 
               ? 'Image Frozen. Resize the clip box freely.' 
               : 'Move Mode. Drag to pan the image.'}
          </div>
        </div>
      )}

      {/* --- Clip Result Modal --- */}
      {selectedRegion && generatedClip && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{selectedRegion.title}</h3>
              <button onClick={() => { setSelectedRegion(null); setGeneratedClip(null); }} className="text-gray-500 hover:text-red-500 p-1 hover:bg-red-50 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-6 flex justify-center">
               <img src={generatedClip} alt="Clip" className="shadow-lg object-contain max-h-[50vh] bg-white" />
            </div>

            <div className="p-6 border-t bg-white">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <a 
                  href={generatedClip} 
                  download={`newsflow_clip_${Date.now()}.jpg`}
                  className="flex-1 sm:flex-none flex items-center justify-center space-x-2 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  <Download size={20} />
                  <span>Download Clip</span>
                </a>

                {selectedRegion.linkedArticleId && (
                  <button 
                    onClick={() => navigate(`/articles/${selectedRegion.linkedArticleId}`)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-colors"
                  >
                    <FileText size={20} />
                    <span>Read Full Article</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
