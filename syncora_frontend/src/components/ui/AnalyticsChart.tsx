import React from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export interface AnalyticsChartProps {
  title: string;
  labels: string[];
  data: number[];
  color?: string;
  compact?: boolean;
  height?: number; 
  type?: 'bar' | 'line' | 'doughnut';
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, labels, data, color = 'rgba(59,130,246,0.7)', compact = false, height, type = 'bar' }) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        backgroundColor: type === 'line' ? undefined : color,
        borderColor: type === 'line' ? color : undefined,
        pointRadius: type === 'line' ? (compact ? 1.5 : 3) : undefined,
        borderWidth: type === 'line' ? (compact ? 2 : 3) : undefined,
        tension: type === 'line' ? 0.35 : undefined,
        fill: type === 'line' ? (compact ? true : false) : undefined,
        borderRadius: type === 'bar' ? 8 : undefined,
      },
    ],
  };

  const options: any = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: !compact && type !== 'doughnut', text: title },
    },
    scales:
      type === 'doughnut'
        ? undefined
        : {
            x: { grid: { display: false }, ticks: { font: { size: compact ? 10 : 12 } } },
            y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: compact ? 10 : 12 } } },
          },
    cutout: type === 'doughnut' ? (compact ? '70%' : '60%') : undefined,
    maintainAspectRatio: compact,
  };

  return (
    <div className={`bg-white dark:bg-background rounded-xl shadow-md ${compact ? 'p-3' : 'p-4'}`}>
      {type === 'bar' && (
        <Bar data={chartData} options={options} height={height ?? (compact ? 160 : undefined)} />
      )}
      {type === 'line' && (
        <Line data={chartData} options={options} height={height ?? (compact ? 160 : undefined)} />
      )}
      {type === 'doughnut' && (
        <Doughnut data={chartData} options={options} height={height ?? (compact ? 160 : undefined)} />
      )}
    </div>
  );
};

export default AnalyticsChart;
