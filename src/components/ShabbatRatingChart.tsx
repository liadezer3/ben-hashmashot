import { useMemo } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface Rating {
  id: string;
  rating: number;
  notes: string | null;
  shabbat_date: string;
  parsha: string | null;
}

interface ShabbatRatingChartProps {
  ratings: Rating[];
}

const chartConfig: ChartConfig = {
  rating: {
    label: "דירוג",
    color: "hsl(var(--primary))",
  },
};

export const ShabbatRatingChart = ({ ratings }: ShabbatRatingChartProps) => {
  const chartData = useMemo(() => {
    return [...ratings]
      .reverse()
      .slice(-12)
      .map((r) => ({
        date: format(new Date(r.shabbat_date + "T12:00:00"), "dd/MM"),
        rating: r.rating,
        fullDate: r.shabbat_date,
        parsha: r.parsha || "",
      }));
  }, [ratings]);

  if (chartData.length < 2) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        דרג לפחות 2 שבתות כדי לראות גרף 📊
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-3">מגמה - 12 שבתות אחרונות</p>
      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickMargin={8}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={24}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            fill="url(#ratingGradient)"
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
