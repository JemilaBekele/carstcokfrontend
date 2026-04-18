'use client';

import PageContainer from '@/components/layout/page-container';
import { TableDashboard } from '@/features/Dasboard/tableexpireinv';
import React from 'react';

export default function OverViewLayout({
  sales,
  bar_stats
}: {
  sales: React.ReactNode;
  bar_stats: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-5 animate-in fade-in duration-300'>
        <div className='flex items-center justify-between pb-2 border-b'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>
              Dashboard Overview
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sales and inventory performance
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4 xl:col-span-5'>
            {bar_stats}
          </div>
          <div className='col-span-4 md:col-span-3 lg:col-span-3 xl:col-span-2 flex flex-col'>
            {sales}
          </div>
        </div>

        <div>
          <TableDashboard />
        </div>
      </div>
    </PageContainer>
  );
}
