import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TrafficHistory } from '../types';
import { formatBytes } from '../types';

interface TrafficChartProps {
  data: TrafficHistory[];
  height?: number;
  color?: string;
  title?: string;
}

export const TrafficChart: React.FC<TrafficChartProps> = ({
  data,
  height = 300,
  color = '#3b82f6',
  title = '流量历史 (24h)',
}) => {
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    fullDate: new Date(d.timestamp).toLocaleString('zh-CN'),
    total: d.upload + d.download,
    upload: d.upload,
    download: d.download,
  }));

  return (
    <div
      style={{ width: '100%', height }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <h3 className="text-gray-400 dark:text-gray-500 text-xs font-bold mb-6 uppercase tracking-wider">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height - 80}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            className="dark:stroke-gray-700"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 12 }}
            tickFormatter={(val) => formatBytes(val, 0)}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              backgroundColor: 'white',
            }}
            itemStyle={{ color }}
            formatter={(value: number) => [formatBytes(value), '流量']}
            labelFormatter={(label) => `时间: ${label}`}
            labelStyle={{ color: '#6b7280', marginBottom: '0.5rem' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTraffic)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// 简化版图表，用于列表卡片
interface MiniChartProps {
  data: TrafficHistory[];
  height?: number;
  color?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  height = 60,
  color = '#3b82f6',
}) => {
  const chartData = data.slice(-12).map((d) => ({
    total: d.upload + d.download,
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="miniColorTraffic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#miniColorTraffic)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
