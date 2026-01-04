import React, { useState, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Font,
  List,
  Alignment,
  Link,
  BlockQuote,
  Table,
  TableToolbar,
  Undo
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

interface CKEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const CKEditorComponent: React.FC<CKEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = '輸入內容...',
  disabled = false 
}) => {
  const [editor, setEditor] = useState<ClassicEditor | null>(null);

  // 處理 disabled 狀態變化
  useEffect(() => {
    if (editor) {
      if (disabled) {
        editor.enableReadOnlyMode('disabled');
      } else {
        editor.disableReadOnlyMode('disabled');
      }
    }
  }, [disabled, editor]);

  return (
    <div className="ckeditor-wrapper">
      <CKEditor
        editor={ClassicEditor}
        config={{
          licenseKey: 'GPL',
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Heading,
            Font,
            List,
            Alignment,
            Link,
            BlockQuote,
            Table,
            TableToolbar,
            Undo
          ],
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              '|',
              'fontSize',
              'fontColor',
              'fontBackgroundColor',
              '|',
              'bulletedList',
              'numberedList',
              '|',
              'alignment',
              '|',
              'link',
              'blockQuote',
              'insertTable',
              '|',
              'undo',
              'redo'
            ],
            shouldNotGroupWhenFull: true
          },
          placeholder,
          language: 'zh',
          fontSize: {
            options: [9, 11, 13, 'default', 17, 19, 21, 27, 35]
          },
          heading: {
            options: [
              { model: 'paragraph', title: '段落', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: '標題 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: '標題 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: '標題 3', class: 'ck-heading_heading3' }
            ]
          },
        }}
        data={value || ''}
        onReady={(editor) => {
          setEditor(editor);
          if (disabled) {
            editor.enableReadOnlyMode('disabled');
          }
        }}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange(data);
        }}
        onBlur={(event, editor) => {
          // Handle blur if needed
        }}
        onFocus={(event, editor) => {
          // Handle focus if needed
        }}
      />
      <style>{`
        .ckeditor-wrapper .ck-editor__editable {
          min-height: 200px;
        }
        .ckeditor-wrapper .ck-editor__editable.ck-read-only {
          background-color: #f3f4f6;
        }
        .dark .ckeditor-wrapper .ck-editor__editable.ck-read-only {
          background-color: #374151;
        }
      `}</style>
    </div>
  );
};

export default CKEditorComponent;
