import { FormStatus } from '@/shared/types/forms';

export const STATUS_CONFIG: Record<
  FormStatus,
  {
    label: string;
    color:
      | 'default'
      | 'primary'
      | 'success'
      | 'error'
      | 'warning'
      | 'info'
      | 'secondary';
  }
> = {
  [FormStatus.DRAFT]: { label: 'Draft', color: 'default' },
  [FormStatus.PUBLISHED]: { label: 'Public', color: 'success' },
  [FormStatus.PRIVATE]: { label: 'Private', color: 'secondary' },
  [FormStatus.CLOSED]: { label: 'Closed', color: 'error' },
};
