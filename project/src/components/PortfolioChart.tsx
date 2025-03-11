import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import { TokenBalance } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PortfolioChartProps {
  holdings: TokenBalance[];
  totalValue: number;
}

export function PortfolioChart({ holdings, totalValue }: PortfolioChartProps) {
  // Get top 5 holdings for the chart, combine the rest into "Others"
  const topHoldings = holdings.slice(0, 5);
  const otherHoldings = holdings.slice(5);
  const otherValue = otherHoldings.reduce((sum, holding) => sum + holding.value, 0);
  
  const data: ChartData<'pie'> = {
    labels: [
      ...topHoldings.map(h => h.token),
      otherHoldings.length > 0 ? 'Others' : null
    ].filter(Boolean) as string[],
    datasets: [{
      data: [
        ...topHoldings.map(h => (h.value / totalValue) * 100),
        otherHoldings.length > 0 ? (otherValue / totalValue) * 100 : null
      ].filter(Boolean) as number[],
      backgroundColor: [
        '#3B82F6', // blue-500
        '#8B5CF6', // purple-500
        '#EC4899', // pink-500
        '#10B981', // emerald-500
        '#F59E0B', // amber-500
        '#6B7280', // gray-500 for Others
      ],
      borderColor: '#ffffff',
      borderWidth: 2,
    }]
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend since we have limited space
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return `${context.label}: ${value.toFixed(1)}%`;
          }
        }
      }
    }
  };

  return (
    <div className="w-full h-full">
      <Pie data={data} options={options} />
    </div>
  );
}