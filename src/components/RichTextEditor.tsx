import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Button } from './ui/button';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Underline,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  return (
    <div className="border rounded-lg p-2">
      <div className="flex gap-1 mb-2 border-b pb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-secondary' : ''}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-secondary' : ''}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-secondary' : ''}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={editor.isActive('link') ? 'bg-secondary' : ''}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>

      {showLinkInput && (
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button size="sm" onClick={addLink}>
            Add Link
          </Button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[100px] p-2 focus:outline-none"
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor; 