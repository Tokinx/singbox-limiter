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

// 时间范围选项
export type TimeRange = '1h' | '24h' | '7d' | '31d';

export const timeRangeOptions: { value: TimeRange; label: string; labelEn: string; hours: number }[] = [
  { value: '1h', label: '1小时', labelEn: '1h', hours: 1 },
  { value: '24h', label: '24小时', labelEn: '24h', hours: 24 },
  { value: '7d', label: '7天', labelEn: '7d', hours: 168 },
  { value: '31d', label: '31天', labelEn: '31d', hours: 744 },
];

interface TrafficChartProps {
  data: TrafficHistory[];
  height?: number;
  color?: string;
  title?: string;
  timeRange?: TimeRange;
  onTimeRangeChange?: (range: TimeRange) => void;
  lang?: 'zh' | 'en';
}

export const TrafficChart: React.FC<TrafficChartProps> = ({
  data,
  height = 300,
  color = '#3b82f6',
  title,
  timeRange = '24h',
  onTimeRangeChange,
  lang = 'zh',
}) => {
  // 根据时间范围格式化时间显示
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (timeRange === '1h' || timeRange === '24h') {
      return date.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const chartData = (data || []).map((d) => ({
    time: formatTime(d.timestamp),
    fullDate: new Date(d.timestamp).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US'),
    total: (d.upload || 0) + (d.download || 0),
    upload: d.upload || 0,
    download: d.download || 0,
  }));

  const currentOption = timeRangeOptions.find(o => o.value === timeRange);
  const rangeLabel = lang === 'zh' ? currentOption?.label : currentOption?.labelEn;

  return (
    <div
      style={{ width: '100%', height }}
      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">
          {title || `${lang === 'zh' ? '流量历史' : 'Traffic'} (${rangeLabel})`}
        </h3>
        {onTimeRangeChange && (
          <div className="flex gap-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  timeRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {lang === 'zh' ? option.label : option.labelEn}
              </button>
            ))}
          </div>
        )}
      </div>
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
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fontSize: 11 }}
            tickFormatter={(val) => formatBytes(val, 0)}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: 'none',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              backgroundColor: 'white',
            }}
            itemStyle={{ color }}
            formatter={(value: number) => [formatBytes(value), lang === 'zh' ? '流量' : 'Traffic']}
            labelFormatter={(label) => `${lang === 'zh' ? '时间' : 'Time'}: ${label}`}
            labelStyle={{ color: '#6b7280', marginBottom: '0.5rem' }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTraffic)"
            animationDuration={800}
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
  const chartData = (data || []).slice(-12).map((d) => ({
    total: (d.upload || 0) + (d.download || 0),
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
