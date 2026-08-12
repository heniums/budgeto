import { FilterDropdown, type FilterDropdownOption } from './FilterDropdown';
import { DATE_PRESETS, type DatePreset } from '@/lib/dateRange';

interface DateRangeButtonProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const presetOptions: FilterDropdownOption[] = DATE_PRESETS.map((preset) => ({
  value: preset.value,
  label: preset.label,
}));

export function DateRangeButton({
  value,
  onChange,
  open,
  onOpenChange,
}: DateRangeButtonProps): JSX.Element {
  return (
    <FilterDropdown
      label="Date"
      value={value}
      options={presetOptions}
      onChange={(next) => onChange(next as DatePreset)}
      ariaLabel="Date range"
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
