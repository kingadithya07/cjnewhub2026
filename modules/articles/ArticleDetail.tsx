
import React from 'react';
// Fix: Ensure standard v6 imports
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_ARTICLES } from '../../services/mockData';
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = MOCK_ARTICLES.find(a => a.id === id);

  if (!article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Article Not Found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-indigo-600 hover:underline">Go Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden my-6">
      <div className="relative h-64 md:h-96">
        <img src={article.thumbnailUrl} alt={article.title} className="w-full h-full object-cover" />
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 p-2 rounded-full shadow hover:bg-white transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-800" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
           <span className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider mb-3 inline-block">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">{article.title}</h1>
        </div>
      </div>

      <div className="p-8">
        <div className="flex items-center space-x-6 text-gray-500 mb-8 border-b pb-8">
          <div className="flex items-center space-x-3">
             {article.authorAvatar ? (
                <img 
                  src={article.authorAvatar} 
                  alt={article.authorName} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shadow-sm">
                   <User size={20} />
                </div>
              )}
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Written By</p>
              <p className="font-bold text-gray-900 leading-tight">{article.authorName}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <Calendar size={18} />
            <span>{new Date(article.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Render Rich Text Content */}
        <div 
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>
    </div>
  );
};
