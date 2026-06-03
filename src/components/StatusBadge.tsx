import { Badge } from './ui/Badge';
import {
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
  STATUS_LABEL,
  STATUS_TONE
} from '@/lib/format';

export function ItemStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_TONE[status] ?? ''}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={PROJECT_STATUS_TONE[status] ?? ''}>
      {PROJECT_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
