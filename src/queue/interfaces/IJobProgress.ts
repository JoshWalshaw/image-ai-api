export interface IJobProgress {
  status: 'Waiting' | 'In Progress' | 'Completed' | 'Error';
  message: string;
  lastUpdated: Date;
}
