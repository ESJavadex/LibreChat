import { useState, memo, useRef, useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { Button, TooltipAnchor } from '@librechat/client';
import { Eye, Pencil, EarthIcon, User } from 'lucide-react';
import { PermissionBits, ResourceType } from 'librechat-data-provider';
import type { TPromptGroup } from 'librechat-data-provider';
import { useLocalize, useAuthContext, useSubmitMessage, useResourcePermissions } from '~/hooks';
import { useRecordPromptUsage } from '~/data-provider';
import VariableDialog from '../dialogs/VariableDialog';
import PreviewPrompt from '../dialogs/PreviewPrompt';
import { detectVariables } from '~/utils';
import ListCard from './ListCard';
import store from '~/store';

function PromptCard({
  group,
  onCardClick,
  children,
}: {
  group: TPromptGroup;
  onCardClick?: () => void;
  children: React.ReactNode;
}) {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const isSharedPrompt = group.author !== user?.id && Boolean(group.authorName);
  const groupIsGlobal = group.isPublic === true;

  return (
    <div className="mb-2 rounded-xl border border-border-light bg-transparent px-1 hover:bg-surface-secondary">
      <ListCard
        name={group.name}
        category={group.category ?? ''}
        onClick={onCardClick}
        snippet={
          typeof group.oneliner === 'string' && group.oneliner.length > 0
            ? group.oneliner
            : (group.productionPrompt?.prompt ?? '')
        }
        icon={
          isSharedPrompt || groupIsGlobal ? (
            <>
              {isSharedPrompt && (
                <TooltipAnchor
                  description={localize('com_ui_by_author', { 0: group.authorName })}
                  side="top"
                  render={
                    <span
                      tabIndex={0}
                      role="img"
                      aria-label={localize('com_ui_by_author', { 0: group.authorName })}
                      className="flex shrink-0 cursor-default items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
                    >
                      <User className="icon-md text-text-secondary" aria-hidden="true" />
                    </span>
                  }
                />
              )}
              {groupIsGlobal && (
                <EarthIcon
                  className="icon-md shrink-0 text-green-400"
                  aria-label={localize('com_ui_sr_global_prompt')}
                />
              )}
            </>
          ) : undefined
        }
      >
        {children}
      </ListCard>
    </div>
  );
}

function ActionButtons({ group, canEdit }: { group: TPromptGroup; canEdit: boolean }) {
  const localize = useLocalize();
  const setEditingPromptId = useSetRecoilState(store.editingPromptId);
  const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
  const previewButtonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <div className="flex items-center gap-1">
        <TooltipAnchor
          description={localize('com_ui_preview')}
          side="top"
          render={
            <Button
              ref={previewButtonRef}
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={localize('com_ui_preview')}
              onClick={(e) => {
                e.stopPropagation();
                setPreviewDialogOpen(true);
              }}
            >
              <Eye className="size-4 text-text-primary" aria-hidden="true" />
            </Button>
          }
        />
        {canEdit && (
          <TooltipAnchor
            description={localize('com_ui_edit')}
            side="top"
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={localize('com_ui_edit')}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPromptId(group._id ?? null);
                }}
              >
                <Pencil className="size-4 text-text-primary" aria-hidden="true" />
              </Button>
            }
          />
        )}
      </div>
      <PreviewPrompt
        group={group}
        open={isPreviewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onCloseAutoFocus={() => {
          requestAnimationFrame(() => {
            previewButtonRef.current?.focus({ preventScroll: true });
          });
        }}
      />
    </>
  );
}

/** Used in the chat sidebar — submits prompts to chat on click */
function ChatGroupItemWithSubmit({ group }: { group: TPromptGroup }) {
  const { submitPrompt } = useSubmitMessage();
  const recordUsage = useRecordPromptUsage();
  const [isVariableDialogOpen, setVariableDialogOpen] = useState(false);

  const { hasPermission } = useResourcePermissions(ResourceType.PROMPTGROUP, group._id || '');
  const canEdit = hasPermission(PermissionBits.EDIT);

  const onCardClick = useCallback(() => {
    const text = group.productionPrompt?.prompt;
    if (!text?.trim()) {
      return;
    }

    if (detectVariables(text)) {
      setVariableDialogOpen(true);
      return;
    }

    submitPrompt(text);
    if (group._id) {
      recordUsage.mutate(group._id);
    }
  }, [group, submitPrompt, recordUsage]);

  return (
    <>
      <PromptCard group={group} onCardClick={onCardClick}>
        <ActionButtons group={group} canEdit={canEdit} />
      </PromptCard>
      <VariableDialog
        open={isVariableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        group={group}
      />
    </>
  );
}

/** Used in the inline prompts view — selects prompt for editing on click */
function ChatGroupItemWithSelect({
  group,
  onSelect,
}: {
  group: TPromptGroup;
  onSelect: (groupId: string) => void;
}) {
  const { hasPermission } = useResourcePermissions(ResourceType.PROMPTGROUP, group._id || '');
  const canEdit = hasPermission(PermissionBits.EDIT);

  const onCardClick = useCallback(() => {
    if (group._id) {
      onSelect(group._id);
    }
  }, [group._id, onSelect]);

  return (
    <PromptCard group={group} onCardClick={onCardClick}>
      <ActionButtons group={group} canEdit={canEdit} />
    </PromptCard>
  );
}

function ChatGroupItem({
  group,
  onSelect,
}: {
  group: TPromptGroup;
  onSelect?: (groupId: string) => void;
}) {
  if (onSelect) {
    return <ChatGroupItemWithSelect group={group} onSelect={onSelect} />;
  }
  return <ChatGroupItemWithSubmit group={group} />;
}

export default memo(ChatGroupItem);
