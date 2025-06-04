export type FileDownloadOptions = {
  content: string;
  filename: string;
  type?: string;
};

export const fileDownload = (options: FileDownloadOptions) => {
  const { content, filename, type = 'text/plain' } = options;
  const blob = new Blob([content], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
