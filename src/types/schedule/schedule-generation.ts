export interface GenerateSchedulePayload {
  startDate: string;
  endDate: string;
  force?: boolean;
}

export interface GenerateScheduleResponse {
  scheduleId: string;
  generatedDates: number;
  generatedRounds: number;
  generatedCheckpoints: number;
}
