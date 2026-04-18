'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { getSellTrendApi } from '@/service/Report'; // Adjust import path as needed

export const description = 'Sell Trend Analysis';

interface SellTrendData {
  month: string;
  total: number;
}

const chartConfig = {
  sales: {
    label: 'Total Sales',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function SellTrendChart() {
  const [chartData, setChartData] = React.useState<SellTrendData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    const fetchSellTrend = async () => {
      try {
        setLoading(true);
        const data = await getSellTrendApi();
        setChartData(data);
      } catch {
        setError('Failed to load sell trend data');
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      fetchSellTrend();
    }
  }, [isClient]);

  const totalSales = React.useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.total, 0),
    [chartData]
  );

  const formatCurrency = (value: number) => {
    return `Br ${value.toLocaleString()}`;
  };

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <Card className='@container/card pt-3!'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0! sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-4!'>
            <div className='bg-muted h-6 w-1/2 animate-pulse rounded'></div>
            <div className='bg-muted h-4 w-1/3 animate-pulse rounded'></div>
          </div>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='bg-muted h-62.5 animate-pulse rounded'></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='@container/card pt-3!'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0! sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-4!'>
            <CardTitle>Sell Trend</CardTitle>
            <CardDescription>Sales performance over time</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='text-destructive flex h-62.5 items-center justify-center'>
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className='@container/card pt-3!'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0! sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-4!'>
            <CardTitle>Sell Trend</CardTitle>
            <CardDescription>Sales performance over time</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='text-muted-foreground flex h-62.5 items-center justify-center'>
            No sales data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card h-full border-border/40 shadow-sm flex flex-col'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0! sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-5 py-4 border-r border-border/40'>
          <CardTitle className="text-lg">Sell Trend Analysis</CardTitle>
          <CardDescription className="text-xs">
            <span className='hidden @[540px]/card:block text-muted-foreground'>
              Monthly revenue performance
            </span>
            <span className='@[540px]/card:hidden'>Sales trend</span>
          </CardDescription>
        </div>
        <div className='flex'>
          <div className='relative flex flex-1 flex-col justify-center gap-0.5 px-5 py-3 text-left transition-colors duration-200 sm:px-6 sm:py-4'>
            <span className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider'>
              {chartConfig.sales.label}
            </span>
            <span className='text-2xl leading-none font-bold text-foreground tracking-tight'>
              {formatCurrency(totalSales)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='flex-1 px-2 pt-4 sm:px-4 sm:pb-4'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-56 w-full'
        >
          <BarChart
            data={chartData}
            margin={{
              left: 10,
              right: 10,
              top: 5,
              bottom: 5
            }}
          >
            <defs>
              <linearGradient id='fillBar2' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={1}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.4}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  year: '2-digit'
                });
              }}
              className="text-xs font-medium text-muted-foreground"
            />
            <ChartTooltip
              cursor={{ fill: 'var(--primary)', opacity: 0.1, radius: 4 }}
              content={
                <ChartTooltipContent
                  className='w-40 shadow-lg border-border/50'
                  nameKey='sales'
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    'Sales'
                  ]}
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar 
              dataKey='total' 
              fill='url(#fillBar2)' 
              radius={[6, 6, 0, 0]} 
              maxBarSize={60} 
              className="hover:opacity-80 transition-opacity" 
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
