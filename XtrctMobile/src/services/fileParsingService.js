// src/services/FileParsingService.js

import { Platform } from 'react-native';

import * as FileSystem from 'react-native-fs';

import { anthropicService } from 'src/services/AnthropicService';

import { appMonitor } from 'src/services/monitoring/AppMonitoringService';



class FileParsingService {

  constructor() {

    this.supportedTypes = {

      text: ['text/plain', 'text/markdown'],

      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

      image: ['image/jpeg', 'image/png', 'image/heic'],

      calendar: ['text/calendar'],

      email: ['message/rfc822']

    };



    this.maxFileSize = 100 * 1024 * 1024; // 100MB

  }



  async parseFile(file, options = {}) {

    try {

      // Validate file

      await this.validateFile(file);



      // Get file content based on type

      const content = await this.getFileContent(file);



      // Process with Claude

      const analysis = await anthropicService.processFile(content, {

        type: this.getFileType(file),

        ...options

      });



      return {

        content: analysis,

        metadata: {

          fileName: file.name,

          fileType: file.type,

          fileSize: file.size,

          parsedAt: new Date().toISOString()

        }

      };

    } catch (error) {

      appMonitor.logError(error, { 

        context: 'file_parsing',

        fileName: file.name,

        fileType: file.type 

      });

      throw error;

    }

  }



  async validateFile(file) {

    // Check file size

    if (file.size > this.maxFileSize) {

      throw new Error('File exceeds maximum size limit');

    }



    // Check file type

    const fileType = this.getFileType(file);

    if (!fileType) {

      throw new Error('Unsupported file type');

    }



    return true;

  }



  getFileType(file) {

    const mimeType = file.type.toLowerCase();

    return Object.entries(this.supportedTypes)

      .find(([_, types]) => types.includes(mimeType))?.[0];

  }



  async getFileContent(file) {

    if (Platform.OS === 'web') {

      return await this.readFileWeb(file);

    } else {

      return await this.readFileNative(file);

    }

  }



  async readFileWeb(file) {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = (e) => resolve(e.target.result);

      reader.onerror = (e) => reject(e);

      reader.readAsText(file);

    });

  }



  async readFileNative(file) {

    try {

      const content = await FileSystem.readFile(file.uri, 'utf8');

      return content;

    } catch (error) {

      throw new Error(`Failed to read file: ${error.message}`);

    }

  }



  async extractTasksFromContent(content, options = {}) {

    try {

      const tasks = await anthropicService.extractTasks(content, {

        format: 'structured',

        ...options

      });



      return tasks.map(task => ({

        ...task,

        source: 'file_parser',

        extractedAt: new Date().toISOString()

      }));

    } catch (error) {

      appMonitor.logError(error, { 

        context: 'task_extraction',

        contentLength: content.length 

      });

      throw error;

    }

  }

}



export const fileParsingService = new FileParsingService();
