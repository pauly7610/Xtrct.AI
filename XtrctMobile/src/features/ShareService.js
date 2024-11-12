// src/features/sharing/services/ShareService.js
import { anthropicService } from 'src/services/AnthropicService';
import { taskService } from 'src/services/taskService';

class ShareService {
  constructor() {
    this.extensionId = 'your-extension-id';
    this.supportedTypes = ['text', 'url', 'file'];
  }

  async handleSharedContent(content, type, metadata = {}) {
    try {
      // Process content based on type
      const processedContent = await this.processContent(content, type);
      
      // Analyze with Claude
      const analysis = await anthropicService.processWithClaude(
        processedContent,
        this.getPromptForType(type)
      );

      // Create task(s) from analysis
      const tasks = await this.createTasksFromAnalysis(analysis, metadata);

      return {
        success: true,
        tasks,
        analysis
      };
    } catch (error) {
      console.error('Share handling failed:', error);
      throw error;
    }
  }

  async processContent(content, type) {
    switch (type) {
      case 'text':
        return content;
      case 'url':
        return await this.fetchUrlContent(content);
      case 'file':
        return await this.readFileContent(content);
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }

  getPromptForType(type) {
    const basePrompt = `
      Analyze this content and extract:
      1. Key tasks or action items
      2. Priority levels
      3. Due dates or deadlines
      4. Dependencies
      5. Required resources
      6. Estimated effort
    `;

    const typeSpecificPrompts = {
      text: 'Focus on explicit and implicit tasks in the text.',
      url: 'Consider the webpage context and any embedded tasks.',
      file: 'Extract structured task information from the document.'
    };
    return `${basePrompt}\n${typeSpecificPrompts[type] || ''}`;
  }

  async createTasksFromAnalysis(analysis, metadata) {
    const tasks = [];

    for (const item of analysis.items) {
      const task = await taskService.createTask({
        title: item.title,
        description: item.description,
        priority: item.priority,
        dueDate: item.dueDate,
        estimatedDuration: item.estimatedEffort,
        source: 'extension',
        sourceUrl: metadata.url,
        sourceType: metadata.type,
        metadata: {
          ...metadata,
          extractedContext: item.context,
          confidence: item.confidence
        }
      });

      tasks.push(task);
    }

    return tasks;
  }

  async fetchUrlContent(url) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      return html;
    } catch (error) {
      console.error('Failed to fetch URL content:', error);
      throw error;
    }
  }

  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  // Extension communication methods
  async sendToExtension(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        this.extensionId,
        message,
        response => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

export const shareService = new ShareService();
