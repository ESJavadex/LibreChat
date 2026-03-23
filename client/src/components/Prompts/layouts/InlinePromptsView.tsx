import { useEffect, useState, useCallback, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { ArrowLeft } from 'lucide-react';
import { Button, useMediaQuery } from '@librechat/client';
import { PermissionTypes, Permissions, SystemRoles } from 'librechat-data-provider';
import { AdvancedSwitch, AdminSettings } from '~/components/Prompts';
import { useHasAccess, useLocalize, useAuthContext } from '~/hooks';
import GroupSidePanel from '../sidebar/GroupSidePanel';
import CreatePromptForm from '../forms/CreatePromptForm';
import FilterPrompts from '../sidebar/FilterPrompts';
import PromptForm from '../forms/PromptForm';
import { cn } from '~/utils';
import store from '~/store';

export default function InlinePromptsView() {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const [editingPromptId, setEditingPromptId] = useRecoilState(store.editingPromptId);
  const isSmallerScreen = useMediaQuery('(max-width: 768px)');

  const isNew = editingPromptId === 'new';
  const isDetailView = editingPromptId !== null;
  const isEditingExisting = isDetailView && !isNew;

  const [panelVisible, setPanelVisible] = useState(!isSmallerScreen);
  const closePanelRef = useRef<HTMLButtonElement>(null);

  const hasAccess = useHasAccess({
    permissionType: PermissionTypes.PROMPTS,
    permission: Permissions.USE,
  });

  const togglePanel = useCallback(() => {
    setPanelVisible((prev) => {
      const newValue = !prev;
      if (newValue) {
        requestAnimationFrame(() => closePanelRef?.current?.focus());
      }
      return newValue;
    });
  }, []);

  useEffect(() => {
    if (isSmallerScreen && isDetailView) {
      setPanelVisible(false);
    }
  }, [isSmallerScreen, isDetailView]);

  const handleCreateSuccess = useCallback(
    (groupId: string) => {
      setEditingPromptId(groupId);
    },
    [setEditingPromptId],
  );

  const handleSelectPrompt = useCallback(
    (groupId: string) => {
      setEditingPromptId(groupId);
    },
    [setEditingPromptId],
  );

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface-primary p-0 lg:p-2">
      <div className="mx-2 mt-2 flex h-10 items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-text-secondary hover:text-text-primary"
          onClick={() => setEditingPromptId(null)}
          aria-label={localize('com_ui_back_to_chat')}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{localize('com_ui_chat')}</span>
        </Button>
        <div className="flex items-center gap-2">
          {isEditingExisting && <AdvancedSwitch />}
          {user?.role === SystemRoles.ADMIN && <AdminSettings />}
        </div>
      </div>
      <div className="flex w-full flex-grow flex-row overflow-hidden">
        {isSmallerScreen && panelVisible && isDetailView && (
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={togglePanel}
            role="button"
            tabIndex={0}
            aria-label={localize('com_nav_toggle_sidebar')}
          />
        )}

        {(!isSmallerScreen || !isDetailView || panelVisible) && (
          <div
            className={cn(
              'transition-transform duration-300 ease-in-out',
              isSmallerScreen && isDetailView
                ? 'fixed left-0 top-0 z-50 h-full w-[320px] bg-surface-primary'
                : 'flex',
            )}
          >
            <GroupSidePanel
              closePanelRef={closePanelRef}
              onClose={isSmallerScreen && isDetailView ? togglePanel : undefined}
              isChatRoute={true}
              onSelect={handleSelectPrompt}
            >
              <div className="mt-1 flex flex-row items-center justify-between px-2">
                <FilterPrompts dropdownClassName="z-[100]" />
              </div>
            </GroupSidePanel>
          </div>
        )}

        <div
          className={cn(
            'scrollbar-gutter-stable min-w-0 flex-1 overflow-y-auto',
            isDetailView ? 'block' : 'hidden md:block',
          )}
        >
          {isNew ? (
            <CreatePromptForm onSuccess={handleCreateSuccess} />
          ) : editingPromptId ? (
            <PromptForm promptId={editingPromptId} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
