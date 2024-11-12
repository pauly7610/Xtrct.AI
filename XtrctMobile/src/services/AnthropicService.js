// src/services/AnthropicService.js

import axios from 'axios';

import { Platform } from 'react-native';

import * as FileSystem from 'react-native-fs';

import { taskService } from './taskService';

import { userService } from './userService';



class AnthropicService {

  constructor() {

    this.API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || 'your-key';

    this.API_URL = 'https://api.anthropic.com/v1/messages';

    this.MODEL = 'claude-3-5-sonnet-20240122';

    this.MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

  }



  async processWithClaude(content, systemPrompt = '') {

    try {

      const response = await axios.post(

        this.API_URL,

        {

          model: this.MODEL,

          max_tokens: 4096,

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

            'x-api-key': this.API_KEY,

            'anthropic-version': '2024-01-01'

          }

        }

      );



      return response.data.content[0].text;

    } catch (error) {

      console.error('Error processing with Claude:', error);

      throw error;

    }

  }



  async readFileContent(file) {

    if (file.size > this.MAX_FILE_SIZE) {

      throw new Error('File size exceeds 100MB limit');

    }



    try {

      // Handle different file types for mobile

      if (Platform.OS === 'ios' || Platform.OS === 'android') {

        const content = await FileSystem.readFile(file.uri, 'utf8');

        return content;

      } else {

        // Web fallback

        return new Promise((resolve, reject) => {

          const reader = new FileReader();

          reader.onload = (event) => resolve(event.target.result);

          reader.onerror = (error) => reject(error);

          reader.readAsText(file);

        });

      }

    } catch (error) {

      console.error('Error reading file:', error);

      throw error;

    }

  }



  async processFile(file, userId) {

    try {

      const fileContent = await this.readFileContent(file);

      

      const systemPrompt = `

        Analyze this content for a mobile task management app. Extract:

        1. Key tasks and deliverables

        2. Priority levels (high/medium/low)

        3. Deadlines and dates

        4. Dependencies

        5. Required resources

        6. Estimated effort (in minutes)

        7. Potential blockers

        8. Mobile-specific considerations



        Return structured JSON for mobile app consumption.

      `;



      const result = await this.processWithClaude(fileContent, systemPrompt);

      const extractedTasks = JSON.parse(result);



      const createdTasks = await Promise.all(

        extractedTasks.map(taskData =>

          taskService.createTask({

            ...taskData,

            userId,

            source: 'mobile_upload',

            sourceFileName: file.name,

            createdVia: 'claude',

            platform: Platform.OS,

            metadata: {

              fileType: file.type,

              fileSize: file.size,

              uploadDate: new Date().toISOString()

            }

          })

        )

      );



      const prioritizedTasks = await this.prioritizeTasks(userId, createdTasks.map(t => t.id));



      return {

        tasks: prioritizedTasks,

        originalAnalysis: extractedTasks

      };

    } catch (error) {

      console.error('Error processing file:', error);

      throw error;

    }

  }



  async prioritizeTasks(userId, specificTaskIds = null) {

    try {

      const tasks = specificTaskIds 

        ? await taskService.fetchUserTasks(userId, { ids: specificTaskIds })

        : await taskService.fetchUserTasks(userId);

      

      const user = await userService.fetchUser(userId);

      const stats = await taskService.getTaskStatistics(userId);

      

      const systemPrompt = `

        Prioritize these tasks for a mobile user considering:

        1. User's completion rate: ${stats.completionRate}%

        2. Average completion time: ${stats.averageCompletionTime}m

        3. Mobile context and interactions

        4. Dependencies and critical path

        5. Due dates and urgency

        6. User preferences: ${JSON.stringify(user.preferences)}

        7. Device type: ${Platform.OS}

        8. Available time blocks

        

        Return mobile-optimized JSON.

      `;



      const result = await this.processWithClaude(

        JSON.stringify({ tasks, userPreferences: user.preferences, stats }),

        systemPrompt

      );



      const prioritizedTasks = JSON.parse(result);



      await Promise.all(

        prioritizedTasks.map(task =>

          taskService.updateTaskStatus(task.id, task.status, {

            priority: task.priority,

            aiReasoning: task.reasoning,

            suggestedStartDate: task.suggestedStartDate,

            workloadImpact: task.workloadImpact,

            riskLevel: task.riskLevel,

            recommendedTimeBlock: task.recommendedTimeBlock,

            mobileOptimized: true

          })

        )

      );



      return prioritizedTasks;

    } catch (error) {

      console.error('Error prioritizing tasks:', error);

      throw error;

    }

  }



  // Add other mobile-specific methods as needed

}



export const anthropicService = new AnthropicService();
