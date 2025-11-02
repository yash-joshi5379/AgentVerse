import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { FlavorProfile } from '../services/flavorProfileService';

interface FlavorRadarChartProps {
  profile: FlavorProfile;
}

export function FlavorRadarChart({ profile }: FlavorRadarChartProps) {
  // Convert profile to chart data format
  const chartData = [
    {
      flavor: 'Spicy',
      value: Math.round(profile.spicy),
      fullMark: 100,
    },
    {
      flavor: 'Sweet',
      value: Math.round(profile.sweet),
      fullMark: 100,
    },
    {
      flavor: 'Salty',
      value: Math.round(profile.salty),
      fullMark: 100,
    },
    {
      flavor: 'Umami',
      value: Math.round(profile.umami),
      fullMark: 100,
    },
    {
      flavor: 'Sour',
      value: Math.round(profile.sour),
      fullMark: 100,
    },
    {
      flavor: 'Bitter',
      value: Math.round(profile.bitter),
      fullMark: 100,
    },
    {
      flavor: 'Rich',
      value: Math.round(profile.rich),
      fullMark: 100,
    },
    {
      flavor: 'Light',
      value: Math.round(profile.light),
      fullMark: 100,
    },
  ];

  return (
    <div className="w-full flex justify-center items-center" style={{ height: '450px', minHeight: '450px', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="70%" 
          data={chartData}
          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
        >
          <PolarGrid 
            stroke="#e5e7eb"
            strokeWidth={1.5}
          />
          <PolarAngleAxis 
            dataKey="flavor" 
            tick={{ 
              fill: '#6b7280', 
              fontSize: 13, 
              fontWeight: 600,
              fontFamily: 'inherit'
            }}
            tickLine={true}
            tickLineType="line"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickCount={5}
          />
          <Radar
            name="Flavor Preference"
            dataKey="value"
            stroke="#5856D6"
            fill="#5856D6"
            fillOpacity={0.6}
            strokeWidth={2.5}
            dot={{ fill: '#5856D6', r: 5, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
