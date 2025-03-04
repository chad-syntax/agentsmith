'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import { IconAlertCircle } from '@tabler/icons-react';

type JsonEditorProps<T> = {
  value: T;
  onChange: (value: T) => void;
  minHeight?: string;
  placeholder?: string;
  label?: string;
};

export const JsonEditor = <T extends object>(props: JsonEditorProps<T>) => {
  const {
    value,
    onChange,
    minHeight = '100px',
    placeholder = '{}',
    label,
  } = props;

  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(value, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      onChange(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="bg-white rounded-lg border">
        <Editor
          value={jsonText}
          onValueChange={handleJsonChange}
          highlight={(code) => highlight(code, languages.json, 'json')}
          padding={16}
          placeholder={placeholder}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            minHeight,
          }}
          className="border rounded-lg"
        />
      </div>
      {jsonError && (
        <div className="text-red-500 text-sm flex items-center gap-2 mt-2">
          <IconAlertCircle size={18} />
          <span>{jsonError}</span>
        </div>
      )}
    </div>
  );
};
