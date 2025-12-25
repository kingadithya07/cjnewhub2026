
import React from 'react';
import { Article } from '../../types';
import { Calendar, User as UserIcon, ArrowRight } from 'lucide-react';

interface ArticleListProps {
  articles: Article[];
}

export const ArticleList: React.FC<ArticleListProps> = ({ articles }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <article key={article.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden group">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={article.thumbnailUrl} 
              alt={article.title} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wider">
              {article.category}
            </span>
          </div>
          
          <div className="p-5 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
              {article.summary}
            </p>
            
            <div className="border-t pt-4 mt-auto">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-2">
                  {article.authorAvatar ? (
                    <img 
                      src={article.authorAvatar} 
                      alt={article.authorName} 
                      className="w-6 h-6 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <UserIcon size={14} />
                    </div>
                  )}
                  <span className="font-medium">{article.authorName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <button className="w-full flex items-center justify-center space-x-2 bg-gray-50 hover:bg-indigo-50 text-indigo-600 font-medium py-2 rounded-lg transition-colors text-sm">
                <span>Read Full Story</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
