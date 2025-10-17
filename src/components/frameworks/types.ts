export interface FrameworkData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
  insights?: string[];
  takeaway?: string;
  chartType?: string;
  [key: string]: any;
}

export interface FrameworkComponentProps {
  data: FrameworkData;
  insights?: string[];
  takeaway?: string;
  chartType?: string;
  className?: string;
}

export interface InsightsListProps {
  insights: string[];
  className?: string;
}

export interface TakeawayProps {
  takeaway: string;
  className?: string;
}
