export interface IJobProgress {
  status: 'Waiting' | 'In Progress' | 'Completed' | 'Cancelled' | 'Error';
  message: string;
  lastUpdated: Date;
}
