'use client';

import { TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { getSellStatusChartApi } from '@/service/Report';

// 橙色调色板 - 从深到浅的橙色渐变
const ORANGE_PALETTE = [
  '#E85D04', // 深橙色 - 用于最高值
  '#F48C06', // 金色橙色
  '#FF6B35', // 亮橙色
  '#FF8C42', // 中等橙色
  '#FF9F1C', // 橙黄色
  '#FFA552', // 浅橙色
  '#FFB347', // 珊瑚橙
  '#FFC085', // 非常浅的橙色
  '#FFCC99', // 浅米色橙
  '#FFE5CC', // 极浅橙色
];

interface ChartDataItem {
  status: string;
  amount: number;
  fill: string;
  label: string;
  count: number;
  percentage: number;
}

interface SellStatusChartData {
  success: boolean;
  summary: {
    totalNetTotal: number;
    totalCount: number;
    data: ChartDataItem[];
  };
  chartData: ChartDataItem[];
  chartConfig: ChartConfig;
  totalAmount: number;
  totalTransactions: number;
}

export function SellStatusChart() {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const data: SellStatusChartData = await getSellStatusChartApi();

        if (data.success) {
          const sortedData = [...data.chartData].sort((a, b) => b.amount - a.amount);
          
          const orangeChartData = sortedData.map((item, index) => ({
            ...item,
            fill: ORANGE_PALETTE[Math.min(index, ORANGE_PALETTE.length - 1)]
          }));

          setChartData(orangeChartData);
          
          const updatedConfig: ChartConfig = {};
          orangeChartData.forEach((item, index) => {
            updatedConfig[item.status] = {
              label: item.label,
              color: ORANGE_PALETTE[Math.min(index, ORANGE_PALETTE.length - 1)]
            };
          });
          setChartConfig(updatedConfig);
          
          setTotalAmount(data.totalAmount);
          setTotalTransactions(data.totalTransactions);
        }
      } catch  {
        toast.error(
          'Failed to load sales status chart data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  if (loading) {
    return (
      <Card className='flex flex-col h-full border-border/40 shadow-sm'>
        <CardHeader className='items-center pb-2 border-b border-border/40'>
          <CardTitle className="text-lg">Sales Status</CardTitle>
          <CardDescription className="text-xs">Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 pb-0 mt-4'>
          <div className='flex aspect-square max-h-56 items-center justify-center'>
            <div className='mb-4 inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 || totalAmount === 0) {
    return (
      <Card className='flex flex-col h-full border-border/40 shadow-sm'>
        <CardHeader className='flex flex-col items-center justify-center gap-1 border-b border-border/40 px-5 py-4'>
          <CardTitle className="text-lg text-center">Sales Distribution</CardTitle>
          <CardDescription className="text-xs text-center">Breakdown by order status</CardDescription>
        </CardHeader>
        <CardContent className='flex-1 px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='text-muted-foreground flex h-62.5 items-center justify-center'>
            No sales data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='flex-col h-full border-border/40 shadow-sm flex transition-all duration-300'>
      <CardHeader className='items-center pb-3 pt-4 border-b border-border/40'>
        <CardTitle className='text-lg'>Sales Distribution</CardTitle>
        <CardDescription className="text-xs">Breakdown by order status</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0 mt-4 relative'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-56 pb-0'
        >
          <PieChart>
            <ChartTooltip
              cursor={{ fill: 'transparent' }}
              content={
                <ChartTooltipContent
                  hideLabel
                  className="shadow-md border-border/50 text-xs"
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString()}`,
                    chartConfig[name as keyof ChartConfig]?.label || name
                  ]}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey='amount'
              nameKey='status'
              innerRadius={65}
              outerRadius={90}
              paddingAngle={2}
              label={false}
              labelLine={false}
              strokeWidth={0}
              className="transition-all duration-300"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fill}
                  className="hover:opacity-80 stroke-background stroke-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {/* Center label for the donut chart */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
          <span className="text-2xl font-bold tracking-tighter">
            {(totalAmount >= 1000 ? (totalAmount / 1000).toFixed(1) + 'k' : totalAmount)}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Total</span>
        </div>
      </CardContent>
      <CardFooter className='flex-col gap-3 text-sm mt-4 bg-muted/10 py-4 px-5 border-t border-border/20'>
        <div className='flex items-center gap-1.5 font-medium text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full'>
          <TrendingUp className='h-3.5 w-3.5' />
          <span>{totalAmount.toLocaleString()} Total Sales</span>
        </div>
        <div className='text-muted-foreground text-center text-[10px]'>
          {totalTransactions} transactions across{' '}
          {chartData.filter((item) => item.count > 0).length} categories
        </div>

        {/* Status Legend */}
        <div className='mt-2 grid w-full grid-cols-2 gap-2'>
          {chartData
            .filter((item) => item.count > 0)
            .map((item) => (
              <div
                key={item.status}
                className='flex items-center justify-between gap-2 text-xs p-1.5 rounded-md hover:bg-muted/50 transition-colors'
              >
                <div className="flex items-center gap-2">
                  <div
                    className='h-2.5 w-2.5 rounded-full shadow-sm'
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className='font-medium text-foreground truncate max-w-17.5 text-[11px]'>{item.label}</span>
                </div>
                <span className='text-muted-foreground font-mono bg-muted px-1 py-0.5 rounded text-[10px]'>
                  {item.count}
                </span>
              </div>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
}