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
  Undo,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// 自定義圖片上傳適配器
class CustomUploadAdapter {
  loader: any;
  xhr?: XMLHttpRequest;

  constructor(loader: any) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(
      (file: File) =>
        new Promise((resolve, reject) => {
          this._initRequest();
          this._initListeners(resolve, reject, file);
          this._sendRequest(file);
        })
    );
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  _initRequest() {
    const token = localStorage.getItem('auth_token');
    const xhr = (this.xhr = new XMLHttpRequest());
    xhr.open('POST', `${API_BASE_URL}/upload/image`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token || ''}`);
    xhr.responseType = 'json';
  }

  _initListeners(resolve: any, reject: any, file: File) {
    const xhr = this.xhr!;
    const loader = this.loader;
    const genericErrorText = `無法上傳圖片: ${file.name}.`;

    xhr.addEventListener('error', () => reject(new Error(genericErrorText)));
    xhr.addEventListener('abort', () => reject());
    xhr.addEventListener('load', () => {
      const response = xhr.response;

      if (!response || response.error) {
        return reject(
          response && response.error ? response.error.message : genericErrorText
        );
      }

      resolve({
        default: response.url,
      });
    });

    if (xhr.upload) {
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          loader.uploadTotal = evt.total;
          loader.uploaded = evt.loaded;
        }
      });
    }
  }

  _sendRequest(file: File) {
    const data = new FormData();
    data.append('upload', file);

    this.xhr!.send(data);
  }
}


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
            Undo,
            Image,
            ImageUpload,
            ImageToolbar,
            ImageCaption,
            ImageStyle,
            ImageResize
          ],
          image: {
            toolbar: [
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:side',
              '|',
              'toggleImageCaption',
              'imageTextAlternative'
            ]
          },
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
              'uploadImage',
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
          // 設置自定義上傳適配器
          editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
            return new CustomUploadAdapter(loader);
          };
          
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
