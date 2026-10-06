import { WorkspaceDiscussionTab } from '@/screens/workspace/WorkspaceDiscussionTab';

export const metadata = {
  title: 'Unified Communications & Slack Messenger — VBridgeConnect',
};

export default function MessagesPage() {
  return (
    <div className="py-2">
      <WorkspaceDiscussionTab />
    </div>
  );
}
