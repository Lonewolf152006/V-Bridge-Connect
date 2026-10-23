import { Suspense } from 'react';
import { WorkspaceHub } from '@/screens/workspace/WorkspaceHub';
import { WorkspaceSkeleton } from '@/components/common/WorkspaceSkeleton';

export const metadata = {
  title: 'Workspace Hub — VBridgeConnect',
};

export default function ProjectWorkspacePage() {
  return (
    <Suspense fallback={<WorkspaceSkeleton />}>
      <WorkspaceHub />
    </Suspense>
  );
}
