// src/services/AnthropicService.js
import axios from 'axios';

const CLAUDE_API_KEY = 'your_anthropic_api_key';
const API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Processes content with Claude API
 * @param {string} content - The content to process
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<string>} - The processed response
 */
const processWithClaude = async (content, systemPrompt = '') => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        system: systemPrompt
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error processing with Claude:', error);
    throw new Error('Failed to process content with Claude');
  }
};

/**
 * Creates a new task based on voice input
 * @param {string} voiceInput - The voice input containing task description
 * @returns {Promise<string>} - The created task description
 */
export const createTaskWithClaude = async (voiceInput) => {
  const systemPrompt = `
    You are a task creation assistant. Create clear, actionable tasks from voice input.
    Format tasks with: priority level, due date (if mentioned), and clear description.
  `;
  
  return processWithClaude(voiceInput, systemPrompt);
};

/**
 * Processes file content to extract tasks and context
 * @param {string} fileContent - The content of the file
 * @param {string} fileType - The type of file (e.g., 'document', 'email', 'notes')
 * @returns {Promise<Object>} - Extracted tasks and context
 */
export const processFileWithClaude = async (fileContent, fileType) => {
  const systemPrompt = `
    Analyze the ${fileType} content and extract:
    1. Tasks and action items
    2. Key context and background information
    3. Relevant dates and deadlines
    4. Priority levels for tasks
    Return the information in a structured format.
  `;

  const result = await processWithClaude(fileContent, systemPrompt);
  return JSON.parse(result);
};

/**
 * Prioritizes tasks based on context and importance
 * @param {Array} tasks - Array of tasks to prioritize
 * @param {Object} context - Additional context information
 * @returns {Promise<Array>} - Prioritized tasks
 */
export const prioritizeTasksWithClaude = async (tasks, context) => {
  const systemPrompt = `
    You are a task prioritization assistant. Consider:
    - Task urgency and importance
    - Dependencies between tasks
    - Available resources and constraints
    - Overall project goals and deadlines
    Rank tasks and provide brief justification for each priority level.
  `;

  const content = JSON.stringify({ tasks, context });
  const result = await processWithClaude(content, systemPrompt);
  return JSON.parse(result);
};

/**
 * Extracts context from words and phrases
 * @param {Array} words - Array of key words or phrases
 * @param {Object} existingContext - Existing context information
 * @returns {Promise<Object>} - Enhanced context information
 */
export const enhanceContextWithClaude = async (words, existingContext) => {
  const systemPrompt = `
    Analyze the provided words/phrases and existing context to:
    1. Identify relationships and patterns
    2. Extract additional meaning and implications
    3. Suggest relevant categories or groupings
    4. Highlight potential impact on task priorities
  `;

  const content = JSON.stringify({ words, existingContext });
  const result = await processWithClaude(content, systemPrompt);
  return JSON.parse(result);
};

/**
 * Processes multiple documents to extract unified context
 * @param {Array} documents - Array of document contents and their types
 * @returns {Promise<Object>} - Unified context and extracted information
 */
export const processDocumentsWithClaude = async (documents) => {
  const systemPrompt = `
    Analyze multiple documents to:
    1. Extract common themes and relationships
    2. Identify overlapping tasks and dependencies
    3. Consolidate context and background information
    4. Suggest task prioritization based on cross-document analysis
  `;

  const result = await processWithClaude(JSON.stringify(documents), systemPrompt);
  return JSON.parse(result);
};

export default {
  createTaskWithClaude,
  processFileWithClaude,
  prioritizeTasksWithClaude,
  enhanceContextWithClaude,
  processDocumentsWithClaude
};