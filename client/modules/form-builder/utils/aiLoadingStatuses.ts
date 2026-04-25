export const AI_LOADING_STATUSES = [
  'Thinking',
  'Planning',
  'Analyzing',
  'Making',
  'Processing',
  'Generating',
  'Building',
  'Searching',
  'Evaluating',
  'Compiling',
  'Designing',
  'Creating',
  'Structuring',
  'Validating',
  'Formatting',
  'Optimizing',
  'Organizing',
  'Configuring',
] as const;

export type AiLoadingStatus = (typeof AI_LOADING_STATUSES)[number];