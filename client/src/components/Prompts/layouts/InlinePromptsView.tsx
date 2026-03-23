import { useCallback } from 'react';
import { useRecoilState } from 'recoil';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useHasAccess } from '~/hooks';
import CreatePromptForm from '../forms/CreatePromptForm';
import PromptForm from '../forms/PromptForm';
import store from '~/store';

export default function InlinePromptsView() {
  const [editingPromptId, setEditingPromptId] = useRecoilState(store.editingPromptId);
  const isNew = editingPromptId === 'new';

  const hasAccess = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });

  const handleCreateSuccess = useCallback(
    (groupId: string) => {
      setEditingPromptId(groupId);
    },
    [setEditingPromptId],
  );

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-surface-primary">
      {isNew ? (
        <CreatePromptForm onSuccess={handleCreateSuccess} />
      ) : editingPromptId ? (
        <PromptForm promptId={editingPromptId} />
      ) : null}
    </div>
  );
}
