// src/services/TaskAnalyzer.js

import { fileParsingService } from 'src/services/fileParsingService';

import { anthropicService } from 'src/services/AnthropicService';

import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

import { DateTime } from 'luxon';

import natural from 'natural';



export class TaskAnalyzer {

  static tokenizer = new natural.WordTokenizer();

  static sentiment = new natural.SentimentAnalyzer();

  

  static indicators = {

    priority: {

      high: [

        'urgent', 'asap', 'deadline', 'critical', 'important', 'emergency', 'due',

        'crucial', 'vital', 'essential', 'immediate', 'priority', 'escalated'

      ],

      medium: [

        'needed', 'required', 'should', 'update', 'review', 'necessary',

        'complete', 'implement', 'develop', 'prepare', 'coordinate'

      ],

      low: [

        'sometime', 'eventually', 'when possible', 'look into', 'consider',

        'might', 'could', 'optional', 'nice to have', 'if time permits'

      ]

    },

    timeframe: {

      immediate: [

        'today', 'asap', 'now', 'immediately', 'urgent', 'cob', 'eod',

        'as soon as possible', 'right away', 'this morning', 'this afternoon'

      ],

      soon: [

        'tomorrow', 'this week', 'next week', 'upcoming', 'soon',

        'within days', 'shortly', 'approaching', 'end of week'

      ],

      scheduled: [

        'next month', 'scheduled', 'planned', 'upcoming', 'in the future',

        'later', 'eventually', 'when possible', 'sometime'

      ]

    },

    context: {

      work: [

        'meeting', 'project', 'deadline', 'client', 'report', 'presentation',

        'email', 'document', 'review', 'team', 'manager', 'stakeholder'

      ],

      personal: [

        'home', 'family', 'appointment', 'shopping', 'exercise', 'health',

        'hobby', 'personal', 'private', 'self', 'life'

      ],

      development: [

        'learn', 'study', 'course', 'training', 'skill', 'improve',

        'develop', 'practice', 'education', 'knowledge'

      ]

    }

  };



  static async analyzeContent(content, options = {}) {

    try {

      const aiAnalysis = await anthropicService.processWithClaude(content, {

        type: 'task_analysis',

        ...options

      });



      const analysis = {

        priority: await this.analyzePriority(content, aiAnalysis),

        timeframe: await this.analyzeTimeframe(content, aiAnalysis),

        context: await this.analyzeContext(content, aiAnalysis),

        dates: await this.extractDates(content),

        tasks: await this.extractTasks(content, aiAnalysis),

        metadata: {

          analyzedAt: new Date().toISOString(),

          wordCount: content.split(/\s+/).length,

          confidence: this.calculateConfidence(content)

        }

      };



      appMonitor.logInfo('Content analysis completed', { 

        contentLength: content.length,

        tasksFound: analysis.tasks.length 

      });



      return this.enrichAnalysis(analysis, options);

    } catch (error) {

      appMonitor.logError(error, { 

        context: 'task_analysis',

        contentLength: content.length 

      });

      throw error;

    }

  }



  static async analyzePriority(content, aiAnalysis = null) {

    try {

      const scores = {

        high: 0,

        medium: 0,

        low: 0

      };



      if (aiAnalysis?.priority) {

        return {

          level: aiAnalysis.priority,

          scores: aiAnalysis.priorityScores,

          confidence: aiAnalysis.confidence

        };

      }



      const tokens = this.tokenizer.tokenize(content.toLowerCase());

      const sentences = content.split(/[.!?]+/);



      Object.entries(this.indicators.priority).forEach(([level, phrases]) => {

        phrases.forEach(phrase => {

          const regex = new RegExp(phrase, 'gi');

          const matches = (content.match(regex) || []).length;

          scores[level] += matches;

        });

      });



      sentences.forEach((sentence, index) => {

        const isEarly = index < sentences.length * 0.3;

        const position_multiplier = isEarly ? 1.5 : 1;

        

        Object.entries(this.indicators.priority).forEach(([level, phrases]) => {

          phrases.forEach(phrase => {

            if (sentence.toLowerCase().includes(phrase)) {

              scores[level] += 1 * position_multiplier;

            }

          });

        });

      });



      return {

        level: this.calculatePriorityLevel(scores),

        scores,

        confidence: this.calculateConfidence(scores)

      };

    } catch (error) {

      appMonitor.logError(error, { context: 'priority_analysis' });

      return { level: 'medium', scores: {}, confidence: 0.5 };

    }

  }



  static async analyzeTimeframe(content, aiAnalysis = null) {

    const now = DateTime.now();

    const tokens = this.tokenizer.tokenize(content.toLowerCase());

    

    const timeframes = {

      immediate: 0,

      soon: 0,

      scheduled: 0

    };



    const dates = await this.extractDates(content);

    const earliestDate = dates.length > 0 ? 

      dates.sort((a, b) => a.date - b.date)[0] : null;



    Object.entries(this.indicators.timeframe).forEach(([timeframe, phrases]) => {

      phrases.forEach(phrase => {

        const regex = new RegExp(phrase, 'gi');

        const matches = (content.match(regex) || []).length;

        timeframes[timeframe] += matches;

      });

    });



    if (earliestDate) {

      const daysUntil = earliestDate.date.diff(now, 'days').days;

      

      if (daysUntil <= 1) timeframes.immediate += 3;

      else if (daysUntil <= 7) timeframes.soon += 2;

      else timeframes.scheduled += 1;

    }



    return {

      timeframe: this.calculateTimeframe(timeframes),

      dates,

      urgency: this.calculateUrgency(timeframes, dates),

      scores: timeframes

    };

  }



  static async extractDates(content) {

    const dates = [];

    const patterns = [

      {

        regex: /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g,

        format: 'MM/dd/yyyy'

      },

      {

        regex: /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/g,

        format: 'yyyy-MM-dd'

      },

      {

        regex: /(today|tomorrow|next week|next month|tonight)/gi,

        natural: true

      },

      {

        regex: /in (\d+) (day|week|month)s?/gi,

        relative: true

      }

    ];



    patterns.forEach(pattern => {

      const matches = content.match(pattern.regex) || [];

      

      matches.forEach(match => {

        try {

          let date;

          if (pattern.natural) {

            date = this.parseNaturalDate(match);

          } else if (pattern.relative) {

            date = this.parseRelativeDate(match);

          } else {

            date = DateTime.fromFormat(match, pattern.format);

          }



          if (date.isValid) {

            dates.push({

              original: match,

              date: date,

              type: pattern.natural ? 'natural' : pattern.relative ? 'relative' : 'explicit'

            });

          }

        } catch (error) {

          console.warn(`Failed to parse date: ${match}`);

        }

      });

    });



    return dates;

  }



  static async extractTasks(content, aiAnalysis = null) {

    try {

      if (aiAnalysis?.tasks) {

        return aiAnalysis.tasks.map(task => ({

          ...task,

          source: 'claude',

          confidence: task.confidence || 0.8

        }));

      }



      const tasks = [];

      const sentences = content.split(/[.!?]+/);



      const taskPatterns = [

        /\b(need|must|should|have to|todo|to-do|task)\b/i,

        /^[-*•]\s/m,

        /\d+\.\s/,

        /@task/i,

        /#todo/i

      ];



      sentences.forEach(sentence => {

        const trimmed = sentence.trim();

        if (trimmed.length === 0) return;



        const isTask = taskPatterns.some(pattern => pattern.test(trimmed));

        

        if (isTask) {

          tasks.push({

            content: trimmed,

            priority: this.calculatePriorityLevel({

              high: this.countMatches(trimmed, this.indicators.priority.high),

              medium: this.countMatches(trimmed, this.indicators.priority.medium),

              low: this.countMatches(trimmed, this.indicators.priority.low)

            }),

            context: this.detectContext(trimmed)

          });

        }

      });



      return tasks;

    } catch (error) {

      appMonitor.logError(error, { context: 'task_extraction' });

      return [];

    }

  }



  static async extractEntities(content) {

    const entities = {

      people: [],

      organizations: [],

      locations: [],

      dates: [],

      emails: [],

      urls: []

    };



    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    entities.emails = content.match(emailRegex) || [];



    const urlRegex = /(https?:\/\/[^\s]+)/g;

    entities.urls = content.match(urlRegex) || [];



    const nameRegex = /[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g;

    const potentialNames = content.match(nameRegex) || [];

    entities.people = [...new Set(potentialNames)];



    return entities;

  }



  static async analyzeSentiment(content) {

    return this.sentiment.getSentiment(this.tokenizer.tokenize(content));

  }



  static calculatePriorityLevel(scores) {

    const total = scores.high * 3 + scores.medium * 2 + scores.low;

    

    if (scores.high >= 2 || total >= 6) return 'high';

    if (scores.medium >= 2 || total >= 3) return 'medium';

    return 'low';

  }



  static calculateTimeframe(scores) {

    const total = scores.immediate * 3 + scores.soon * 2 + scores.scheduled;

    

    if (scores.immediate >= 2 || total >= 6) return 'immediate';

    if (scores.soon >= 2 || total >= 3) return 'soon';

    return 'scheduled';

  }



  static calculateConfidence(analysis) {

    return 0.8;

  }



  static countMatches(text, patterns) {

    return patterns.reduce((count, pattern) => {

      const matches = text.match(new RegExp(pattern, 'gi'));

      return count + (matches ? matches.length : 0);

    }, 0);

  }



  static detectContext(text) {

    const contexts = {};

    Object.entries(this.indicators.context).forEach(([context, indicators]) => {

      contexts[context] = this.countMatches(text, indicators);

    });



    return Object.entries(contexts)

      .sort(([,a], [,b]) => b - a)[0][0];

  }



  static parseNaturalDate(text) {

    const now = DateTime.now();

    

    switch (text.toLowerCase()) {

      case 'today':

        return now;

      case 'tomorrow':

        return now.plus({ days: 1 });

      case 'next week':

        return now.plus({ weeks: 1 });

      case 'next month':

        return now.plus({ months: 1 });

      case 'tonight':

        return now.set({ hour: 20 });

      default:

        return now;

    }

  }



  static parseRelativeDate(text) {

    const now = DateTime.now();

    const match = text.match(/in (\d+) (day|week|month)s?/i);

    

    if (match) {

      const [, amount, unit] = match;

      return now.plus({ [unit + 's']: parseInt(amount) });

    }

    

    return now;

  }



  static enrichAnalysis(analysis, options) {

    return {

      ...analysis,

      suggestions: this.generateSuggestions(analysis),

      risks: this.identifyRisks(analysis),

      aiEnhanced: Boolean(options.useAI),

      timestamp: new Date().toISOString()

    };

  }



  static generateSuggestions(analysis) {

    const suggestions = [];



    if (analysis.priority.level === 'high' && analysis.timeframe.timeframe === 'immediate') {

      suggestions.push('Consider immediate action required');

    }



    if (analysis.tasks.length > 3) {

      suggestions.push('Consider breaking down into smaller subtasks');

    }



    return suggestions;

  }



  static identifyRisks(analysis) {

    const risks = [];



    if (analysis.priority.level === 'high' && analysis.timeframe.timeframe === 'scheduled') {

      risks.push('High priority task with delayed timeframe');

    }



    if (analysis.sentiment < -0.5) {

      risks.push('Negative context might indicate complications');

    }



    return risks;

  }

}



export default TaskAnalyzer;
