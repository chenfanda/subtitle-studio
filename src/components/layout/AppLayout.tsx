import { UploadStage } from '../pages/UploadStage';
import { ProcessingStage } from '../pages/ProcessingStage';
import { EditingStage } from '../pages/EditingStage';
import { useAppStage } from '@/stores/useProjectStore';

export function AppLayout() {
  const appStage = useAppStage();

  switch (appStage) {
    case 'upload':
      return <UploadStage />;
    case 'processing':
      return <ProcessingStage />;
    case 'editing':
      return <EditingStage />;
    default:
      return <UploadStage />;
  }
}