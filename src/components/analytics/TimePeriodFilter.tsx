import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

interface TimePeriodFilterProps {
  value: 'month' | 'quarter' | 'year';
  onChange: (value: 'month' | 'quarter' | 'year') => void;
}

const TimePeriodFilter = ({ value, onChange }: TimePeriodFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('timePeriod')}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">{t('month')}</SelectItem>
          <SelectItem value="quarter">{t('quarter')}</SelectItem>
          <SelectItem value="year">{t('year')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimePeriodFilter;
