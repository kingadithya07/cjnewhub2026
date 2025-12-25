
import React, { useState, useEffect } from 'react';
import { Article } from '../types';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
// Fix: Ensure standard v6 imports
import { useNavigate } from 'react-router-dom';

interface HeroSliderProps {
  articles: Article[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ articles }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Auto-advance
  useEffect(() => {
    if (articles.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % articles.length);
    }, 5000); // 5 seconds per slide
    return () => clearInterval(interval);
  }, [articles.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % articles.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
  };

  if (articles.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-xl group">
      {/* Slides */}
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <img
            src={article.thumbnailUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 max-w-4xl">
             <div className="flex items-center space-x-2 mb-3">
               <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                 {article.category}
               </span>
               <span className="flex items-center text-yellow-400 text-xs font-bold gap-1 bg-black/50 px-2 py-1 rounded-full">
                 <Star size={10} fill="currentColor" /> Featured
               </span>
             </div>
             <h2 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-md">
               {article.title}
             </h2>
             <p className="text-gray-200 text-sm md:text-lg mb-6 line-clamp-2 md:line-clamp-none max-w-2xl">
               {article.summary}
             </p>
             <button 
               onClick={() => navigate(`/articles/${article.id}`)}
               className="bg-white hover:bg-indigo-50 text-indigo-900 font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg"
             >
               Read Full Story
             </button>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      {articles.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full z-30 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/60 text-white p-3 rounded-full z-30 transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {articles.length > 1 && (
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-30 flex space-x-2">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
