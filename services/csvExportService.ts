import { RunRecord } from '../types';

const convertToCSV = (objArray: any[], headers: string[]) => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  let str = `${headers.join(',')}\r\n`;

  for (let i = 0; i < array.length; i++) {
    let line = '';
    const keys = Object.keys(array[i]);
    // Use headers to ensure order and inclusion of columns
    for (const headerKey of headers) {
        // Find the corresponding key in the object (case-insensitive for flexibility)
        const objectKey = keys.find(k => k.toLowerCase() === headerKey.toLowerCase().replace(/ /g, ''))
        if(objectKey) {
            if (line !== '') line += ',';
            // handle values that might contain commas
            const value = String(array[i][objectKey] ?? '').replace(/"/g, '""');
            line += `"${value}"`;
        } else {
             if (line !== '') line += ',';
             line += '""';
        }
    }
    str += line + '\r\n';
  }
  return str;
};

export const exportToCSV = (data: RunRecord[], filename: string) => {
  if (!data || data.length === 0) {
    alert("Нет данных для экспорта.");
    return;
  }
  
  const headers = ['id', 'pvmNumber', 'date', 'type', 'streamId', 'mileage', 'billetCount', 'billetSize', 'scrap'];
  const csvString = convertToCSV(data, headers);
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};