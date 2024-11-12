// src/features/sharing/services/ContentParser.js
class ContentParser {
    constructor() {
      this.parsers = {
        text: this.parseText,
        url: this.parseUrl,
        html: this.parseHtml,
        markdown: this.parseMarkdown
      };
    }
  
    async parse(content, type, options = {}) {
      const parser = this.parsers[type];
      if (!parser) {
        throw new Error(`No parser available for type: ${type}`);
      }
  
      try {
        const parsed = await parser(content, options);
        return this.standardizeOutput(parsed, type);
      } catch (error) {
        console.error(`Parsing failed for ${type}:`, error);
        throw error;
      }
    }
  
    parseText(text, options = {}) {
      const lines = text.split('\n');
      const tasks = [];
      let currentTask = null;
  
      for (const line of lines) {
        // Task markers
        if (line.match(/^[-*]\s|^\d+\.\s|TODO:|TASK:/i)) {
          if (currentTask) {
            tasks.push(this.finalizeTask(currentTask));
          }
          currentTask = this.initializeTask(line);
          continue;
        }

        // Date detection
        const dateMatch = line.match(/by|due|deadline:?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i);
        if (currentTask && dateMatch) {
          currentTask.dueDate = this.parseDate(dateMatch[1]);
        }
  
        // Priority markers
        const priorityMatch = line.match(/!important|!urgent|priority:\s*(high|medium|low)/i);
        if (currentTask && priorityMatch) {
          currentTask.priority = priorityMatch[1]?.toLowerCase() || 'high';
        }
  
        // Add to description
        if (currentTask && line.trim()) {
          currentTask.description += line + '\n';
        }
      }
  
      if (currentTask) {
        tasks.push(this.finalizeTask(currentTask));
      }
  
      return tasks;
    }
  
    async parseUrl(url, options = {}) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        return this.parseHtml(html, { ...options, sourceUrl: url });
      } catch (error) {
        console.error('URL parsing failed:', error);
        throw error;
      }
    }

    parseHtml(html, options = {}) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tasks = [];
    
        // Extract from common task patterns
        const taskElements = doc.querySelectorAll(
          'input[type="checkbox"], .task, .todo, [data-task]'
        );
    
        taskElements.forEach(element => {
          const task = {
            title: element.textContent.trim(),
            sourceElement: element.tagName,
            sourceUrl: options.sourceUrl,
            metadata: {
              classes: Array.from(element.classList),
              attributes: this.getElementAttributes(element)
            }
          };
    
          tasks.push(task);
        });
    
        // Extract from text content
        const textContent = doc.body.textContent;
        const textTasks = this.parseText(textContent);
        tasks.push(...textTasks);
    
        return tasks;
      }
    
      parseMarkdown(markdown, options = {}) {
        const tasks = [];
        const lines = markdown.split('\n');

        for (const line of lines) {
            // Task list items
            const taskMatch = line.match(/^[-*] \[([ x])\] (.+)/);
            if (taskMatch) {
              tasks.push({
                title: taskMatch[2],
                completed: taskMatch[1] === 'x',
                type: 'checkbox'
              });
              continue;
            }
      
            // Headers with task-like content
            const headerMatch = line.match(/^(#{1,6})\s*(.+)/);
            if (headerMatch && this.looksLikeTask(headerMatch[2])) {
              tasks.push({
                title: headerMatch[2],
                level: headerMatch[1].length,
                type: 'header'
              });
            }
          }
      
          return tasks;
        }
      
        // Helper methods
        initializeTask(line) {
          return {
            title: line.replace(/^[-*]\s|\d+\.\s|TODO:|TASK:/i, '').trim(),
            description: '',
            priority: 'medium',
            created: new Date().toISOString()
          };
        }

        finalizeTask(task) {
            return {
              ...task,
              description: task.description.trim(),
              metadata: {
                source: 'content-parser',
                confidence: this.calculateConfidence(task)
              }
            };
          }
        
          parseDate(dateString) {
            const date = new Date(dateString);
            return date.toISOString();
          }
        
          getElementAttributes(element) {
            const attributes = {};
            for (const attr of element.attributes) {
              attributes[attr.name] = attr.value;
            }
            return attributes;
          }
        
          looksLikeTask(text) {
            return /task|todo|fixme|bug|feature|implement|add|create|update/i.test(text);
          }
        
          calculateConfidence(task) {
            let score = 0;
            if (task.title.length > 10) score += 0.2;
            if (task.description) score += 0.2;
            if (task.dueDate) score += 0.3;
            if (task.priority !== 'medium') score += 0.3;
            return Math.min(score, 1);
          }

          standardizeOutput(parsed, type) {
            return {
              tasks: parsed,
              metadata: {
                type,
                timestamp: new Date().toISOString(),
                count: parsed.length
              }
            };
          }
        }
        
        export const contentParser = new ContentParser();
