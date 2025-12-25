
import React, { useRef, useEffect } from 'react';
import { 
  Bold, Italic, List, AlignLeft, Underline, Strikethrough, 
  Heading1, Heading2, ListOrdered, Undo, Redo, Quote 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync value to innerHTML only when it changes externally (e.g. reset)
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
        // Only set if completely different to avoid cursor jumping, 
        // mainly for initial load or form reset.
        if(value === '' || value === '<br>' || !contentRef.current.innerHTML) {
            contentRef.current.innerHTML = value;
        }
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (contentRef.current) onChange(contentRef.current.innerHTML);
    contentRef.current?.focus();
  };

  const ToolbarButton = ({ onClick, icon: Icon, title }: { onClick: () => void, icon: any, title: string }) => (
    <button 
        type="button" 
        onClick={onClick} 
        className="p-1.5 text-gray-600 hover:bg-gray-200 hover:text-indigo-600 rounded transition-colors flex-shrink-0"
        title={title}
    >
        <Icon size={16} />
    </button>
  );

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden bg-white flex flex-col ${className}`}>
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex items-center gap-1 overflow-x-auto scrollbar-hide select-none">
        <ToolbarButton onClick={() => execCommand('undo')} icon={Undo} title="Undo" />
        <ToolbarButton onClick={() => execCommand('redo')} icon={Redo} title="Redo" />
        
        <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>
        
        <ToolbarButton onClick={() => execCommand('formatBlock', 'H1')} icon={Heading1} title="Heading 1" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'H2')} icon={Heading2} title="Heading 2" />
        
        <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>

        <ToolbarButton onClick={() => execCommand('bold')} icon={Bold} title="Bold" />
        <ToolbarButton onClick={() => execCommand('italic')} icon={Italic} title="Italic" />
        <ToolbarButton onClick={() => execCommand('underline')} icon={Underline} title="Underline" />
        <ToolbarButton onClick={() => execCommand('strikeThrough')} icon={Strikethrough} title="Strikethrough" />
        
        <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>
        
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon={List} title="Bullet List" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon={ListOrdered} title="Ordered List" />
        <ToolbarButton onClick={() => execCommand('formatBlock', 'blockquote')} icon={Quote} title="Quote" />
      </div>
      
      <div
        ref={contentRef}
        className="p-4 min-h-[200px] outline-none prose prose-sm max-w-none focus:bg-indigo-50/10 transition-colors overflow-y-auto"
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          display: block; /* For Firefox */
        }
        /* Custom scrollbar for toolbar */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
