import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export interface ChannelFrequencyValue {
  frequency: "weekly" | "daily" | "holidays_only";
  morningTime: string;
  daysBeforeShabbat: number;
  reminderTime: string;
}

interface Props {
  idPrefix: string;
  value: ChannelFrequencyValue;
  onChange: (next: ChannelFrequencyValue) => void;
  accentClassName?: string;
  channelLabel: string;
}

/**
 * Reusable per-channel frequency settings (used for Email / Push / SMS / WhatsApp / Telegram).
 * Lets the user pick weekly / daily / holidays-only delivery and the corresponding times.
 */
export const ChannelFrequencySettings = ({
  idPrefix,
  value,
  onChange,
  accentClassName = "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400",
  channelLabel,
}: Props) => {
  const update = (patch: Partial<ChannelFrequencyValue>) =>
    onChange({ ...value, ...patch });

  const summary =
    value.frequency === "daily"
      ? `כל יום בשעה ${value.morningTime}`
      : value.frequency === "holidays_only"
      ? `לפני חגים בשעה ${value.reminderTime}`
      : `שבועי בשעה ${value.reminderTime}`;

  return (
    <div className="space-y-3 pt-3 border-t border-border/60">
      <div>
        <Label htmlFor={`${idPrefix}-frequency`} className="text-sm font-medium">
          תדירות שליחה
        </Label>
        <select
          id={`${idPrefix}-frequency`}
          value={value.frequency}
          onChange={(e) => update({ frequency: e.target.value as ChannelFrequencyValue["frequency"] })}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="weekly">פעם בשבוע - לפני שבת</option>
          <option value="daily">כל יום - תזכורת בוקר</option>
          <option value="holidays_only">רק לפני חגים</option>
        </select>
      </div>

      {value.frequency === "daily" && (
        <div>
          <Label htmlFor={`${idPrefix}-morning-time`} className="text-sm">
            שעת שליחה יומית
          </Label>
          <Input
            id={`${idPrefix}-morning-time`}
            type="time"
            value={value.morningTime}
            onChange={(e) => update({ morningTime: e.target.value })}
            className="mt-2"
          />
        </div>
      )}

      {(value.frequency === "weekly" || value.frequency === "holidays_only") && (
        <>
          <div>
            <Label htmlFor={`${idPrefix}-days-before`} className="text-sm">
              כמה ימים לפני שבת/חג
            </Label>
            <select
              id={`${idPrefix}-days-before`}
              value={value.daysBeforeShabbat}
              onChange={(e) => update({ daysBeforeShabbat: parseInt(e.target.value) })}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value={0}>באותו יום</option>
              <option value={1}>יום לפני</option>
              <option value={2}>יומיים לפני</option>
              <option value={3}>3 ימים לפני</option>
            </select>
          </div>
          <div>
            <Label htmlFor={`${idPrefix}-reminder-time`} className="text-sm">
              שעת תזכורת
            </Label>
            <Input
              id={`${idPrefix}-reminder-time`}
              type="time"
              value={value.reminderTime}
              onChange={(e) => update({ reminderTime: e.target.value })}
              className="mt-2"
            />
          </div>
        </>
      )}

      <div className={`flex items-center gap-2 p-2 rounded border ${accentClassName}`}>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span className="text-xs">
          {channelLabel} פעיל - {summary}
        </span>
      </div>
    </div>
  );
};
