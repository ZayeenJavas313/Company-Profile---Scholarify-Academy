export type Subtest = {
  id: string;
  batchId: string;
  title: string;
  description: string;
  duration: number; // minutes
};

export type QuestionOption = {
  key: string;
  text: string;
};

export type Question = {
  id: string;
  subtestId: string;
  section?: string;
  question: string;
  options: QuestionOption[];
  answer: string;
  explanation?: string;
};