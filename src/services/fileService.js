// src/services/FileParsingService.js
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import XLSX from 'xlsx';
import { Parser } from 'json2csv';

export const parseFile = async (file) => {
  const fileType = file.type || getFileTypeFromExtension(file.name);
  
  try {
    switch (fileType) {
      case 'application/pdf':
        return await parsePDF(file);
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await parseWord(file);
      
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return await parseExcel(file);
      
      case 'text/plain':
        return await parseText(file);
      
      case 'text/markdown':
      case 'text/md':
        return await parseMarkdown(file);
      
      case 'application/json':
        return await parseJSON(file);
      
      case 'text/csv':
        return await parseCSV(file);
      
      case 'text/calendar':
      case 'application/ics':
        return await parseICalendar(file);
      
      case 'message/rfc822':
      case 'application/vnd.ms-outlook':
        return await parseEmail(file);
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error(`Error parsing file: ${error}`);
    throw new Error('Failed to parse file');
  }
};

const getFileTypeFromExtension = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'csv': 'text/csv',
    'ics': 'text/calendar',
    'eml': 'message/rfc822',
    'msg': 'application/vnd.ms-outlook'
  };
  return mimeTypes[extension] || 'application/octet-stream';
};

// Individual file type parsers
const parsePDF = async (file) => {
  const buffer = await file.arrayBuffer();
  const data = await pdf(buffer);
  return data.text;
};

const parseWord = async (file) => {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

const parseExcel = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheets = {};
  
  workbook.SheetNames.forEach(sheetName => {
    sheets[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  });
  
  return JSON.stringify(sheets);
};

const parseText = async (file) => {
  return await file.text();
};

const parseMarkdown = async (file) => {
  return await file.text();
};

const parseJSON = async (file) => {
  const text = await file.text();
  return JSON.parse(text);
};

const parseCSV = async (file) => {
  const text = await file.text();
  return new Promise((resolve, reject) => {
    const parser = new Parser();
    try {
      const json = parser.parse(text);
      resolve(json);
    } catch (err) {
      reject(err);
    }
  });
};

const parseICalendar = async (file) => {
  const text = await file.text();
  return ical.parseICS(text);
};

const parseEmail = async (file) => {
  // Implement email parsing based on format (EML or MSG)
  const buffer = await file.arrayBuffer();
  // Add specific email parsing logic here
  return buffer;
};