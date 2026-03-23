import { Plus } from 'lucide-react';
import { useSetRecoilState } from 'recoil';
import { Link, useLocation } from 'react-router-dom';
import { Button, TooltipAnchor } from '@librechat/client';
import { PermissionTypes, Permissions } from 'librechat-data-provider';
import { useHasAccess, useLocalize } from '~/hooks';
import store from '~/store';

export default function CreatePromptButton() {
  const localize = useLocalize();
  const location = useLocation();
  const setEditingPromptId = useSetRecoilState(store.editingPromptId);
  const isChatRoute = location.pathname?.startsWith('/c/');
  const hasCreateAccess = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.CREATE,
  });

  if (!hasCreateAccess) {
    return null;
  }

  if (isChatRoute) {
    return (
      <TooltipAnchor
        description={localize('com_ui_create_prompt')}
        side="bottom"
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-9 shrink-0 bg-transparent"
            aria-label={localize('com_ui_create_prompt')}
            onClick={() => setEditingPromptId('new')}
          >
            <Plus className="size-4" aria-hidden="true" />
          </Button>
        }
      />
    );
  }

  return (
    <TooltipAnchor
      description={localize('com_ui_create_prompt')}
      side="bottom"
      render={
        <Button
          asChild
          variant="outline"
          size="icon"
          className="size-9 shrink-0 bg-transparent"
          aria-label={localize('com_ui_create_prompt')}
        >
          <Link to="/d/prompts/new">
            <Plus className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      }
    />
  );
}
