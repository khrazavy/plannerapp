import { FrameworkTemplate } from './types';

export const LEAN_CANVAS: FrameworkTemplate = {
  type: 'lean_canvas',
  title: 'Lean Canvas',
  blocks: [
    {
      key: 'problem',
      title: 'Problem',
      hint: 'What are the top 3 problems your target customers face? List existing alternatives.',
      placeholder: 'Top problems your customers face...',
      gridArea: { row: 1, col: 1, rowSpan: 2, colSpan: 1 },
    },
    {
      key: 'solution',
      title: 'Solution',
      hint: 'What are the top 3 features that address the problems? Keep it concise.',
      placeholder: 'Key features that solve the problems...',
      gridArea: { row: 1, col: 2, rowSpan: 2, colSpan: 1 },
    },
    {
      key: 'unique_value_prop',
      title: 'Unique Value Proposition',
      hint: 'A single clear message that captures why you are different and worth buying.',
      placeholder: 'Why customers should choose you...',
      gridArea: { row: 1, col: 3, rowSpan: 2, colSpan: 1 },
    },
    {
      key: 'unfair_advantage',
      title: 'Unfair Advantage',
      hint: 'Something that cannot be easily copied or bought. Insider access, community, etc.',
      placeholder: 'What you have that others cannot replicate...',
      gridArea: { row: 1, col: 4, rowSpan: 1, colSpan: 1 },
    },
    {
      key: 'customer_segments',
      title: 'Customer Segments',
      hint: 'Who are your target customers? Who are the early adopters?',
      placeholder: 'Target customers and early adopters...',
      gridArea: { row: 1, col: 5, rowSpan: 2, colSpan: 1 },
    },
    {
      key: 'key_metrics',
      title: 'Key Metrics',
      hint: 'What are the key activities and numbers that tell you how the business is performing?',
      placeholder: 'Numbers that matter most...',
      gridArea: { row: 3, col: 1, rowSpan: 1, colSpan: 2 },
    },
    {
      key: 'channels',
      title: 'Channels',
      hint: 'How do you reach your customers? What are the paths to customers?',
      placeholder: 'Paths to reach your customers...',
      gridArea: { row: 3, col: 3, rowSpan: 1, colSpan: 3 },
    },
    {
      key: 'cost_structure',
      title: 'Cost Structure',
      hint: 'What are the fixed and variable costs to operate this business?',
      placeholder: 'Fixed and variable costs...',
      gridArea: { row: 4, col: 1, rowSpan: 1, colSpan: 3 },
    },
    {
      key: 'revenue_streams',
      title: 'Revenue Streams',
      hint: 'How do you make money? What is the revenue model and pricing strategy?',
      placeholder: 'How you generate revenue...',
      gridArea: { row: 4, col: 4, rowSpan: 1, colSpan: 2 },
    },
  ],
};

export const FRAMEWORK_TEMPLATES = new Map<string, FrameworkTemplate>([
  [LEAN_CANVAS.type, LEAN_CANVAS],
]);

export function getFrameworkTemplate(type: string): FrameworkTemplate | undefined {
  return FRAMEWORK_TEMPLATES.get(type);
}
