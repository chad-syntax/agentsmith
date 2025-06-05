import { highlight, languages } from 'prismjs';
import Editor from 'react-simple-code-editor';
import './json-editor.css';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-typescript';

type TypescriptEditorProps = Omit<React.ComponentProps<typeof Editor>, 'highlight'>;

export const TypescriptEditor = (props: TypescriptEditorProps) => {
  return (
    <Editor highlight={(code) => highlight(code, languages.typescript, 'typescript')} {...props} />
  );
};
