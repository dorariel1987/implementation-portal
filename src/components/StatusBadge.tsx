import { Badge } from './ui/Badge';
import {
  PROJECT_STATUS_TONE,
  STATUS_TONE,
  statusLabel,
  projectStatusLabel
} from '@/lib/format';
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config';

export function ItemStatusBadge({
  status,
  locale = DEFAULT_LOCALE
}: {
  status: string;
  locale?: Locale;
}) {
  return (
    <Badge className={STATUS_TONE[status] ?? ''}>
      {statusLabel(status, locale)}
    </Badge>
  );
}

export function ProjectStatusBadge({
  status,
  locale = DEFAULT_LOCALE
}: {
  status: string;
  locale?: Locale;
}) {
  return (
    <Badge className={PROJECT_STATUS_TONE[status] ?? ''}>
      {projectStatusLabel(status, locale)}
    </Badge>
  );
}
