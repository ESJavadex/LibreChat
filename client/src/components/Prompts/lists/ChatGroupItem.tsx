import { useState, memo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, EarthIcon, User } from 'lucide-react';
import { PermissionBits, ResourceType } from 'librechat-data-provider';
import type { TPromptGroup } from 'librechat-data-provider';
import {
  Input,
  Label,
  Button,
  Spinner,
  OGDialog,
  TooltipAnchor,
  OGDialogTrigger,
  OGDialogTemplate,
  useToastContext,
} from '@librechat/client';
import { useLocalize, useAuthContext, useSubmitMessage, useResourcePermissions } from '~/hooks';
import { useRecordPromptUsage, useDeletePromptGroup, useUpdatePromptGroup } from '~/data-provider';
import { useLiveAnnouncer } from '~/Providers';
import VariableDialog from '../dialogs/VariableDialog';
import PreviewPrompt from '../dialogs/PreviewPrompt';
import { detectVariables } from '~/utils';
import ListCard from './ListCard';

function ChatGroupItem({ group }: { group: TPromptGroup }) {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { submitPrompt } = useSubmitMessage();
  const recordUsage = useRecordPromptUsage();
  const { showToast } = useToastContext();
  const { announcePolite } = useLiveAnnouncer();

  const isSharedPrompt = group.author !== user?.id && Boolean(group.authorName);
  const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isVariableDialogOpen, setVariableDialogOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(group.name);

  const groupIsGlobal = group.isPublic === true;

  const { hasPermission } = useResourcePermissions(ResourceType.PROMPTGROUP, group._id || '');
  const canEdit = hasPermission(PermissionBits.EDIT);
  const canDelete = hasPermission(PermissionBits.DELETE);

  const previewButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!renameOpen) {
      setNameInputValue(group.name);
    }
  }, [group.name, renameOpen]);

  const updateGroup = useUpdatePromptGroup({
    onSuccess: () => {
      setRenameOpen(false);
      showToast({ status: 'success', message: localize('com_ui_prompt_renamed') });
      announcePolite({ message: localize('com_ui_prompt_renamed'), isStatus: true });
    },
    onError: () => {
      showToast({ status: 'error', message: localize('com_ui_prompt_update_error') });
    },
  });

  const deleteGroup = useDeletePromptGroup({
    onSuccess: () => {
      announcePolite({
        message: localize('com_ui_prompt_deleted_group', { 0: group.name }),
        isStatus: true,
      });
    },
  });

  const handleSaveRename = useCallback(() => {
    updateGroup.mutate({ id: group._id ?? '', payload: { name: nameInputValue } });
  }, [group._id, nameInputValue, updateGroup]);

  const handleDelete = useCallback(() => {
    deleteGroup.mutate({ id: group._id ?? '' });
  }, [group._id, deleteGroup]);

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
      <div className="mb-2 rounded-xl border border-border-medium bg-transparent px-1 hover:bg-surface-secondary">
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
                      navigate(`/prompts/${group._id}`);
                    }}
                  >
                    <Pencil className="size-4 text-text-primary" aria-hidden="true" />
                  </Button>
                }
              />
            )}
            {canEdit && (
              <OGDialog open={renameOpen} onOpenChange={setRenameOpen}>
                <OGDialogTrigger asChild>
                  <TooltipAnchor
                    description={localize('com_ui_rename')}
                    side="top"
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={localize('com_ui_rename_prompt_name', { name: group.name })}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg
                          className="size-4 text-text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                        </svg>
                      </Button>
                    }
                  />
                </OGDialogTrigger>
                <OGDialogTemplate
                  showCloseButton={false}
                  title={localize('com_ui_rename_prompt')}
                  className="w-11/12 max-w-md"
                  main={
                    <Input
                      value={nameInputValue}
                      onChange={(e) => setNameInputValue(e.target.value)}
                      className="w-full"
                      aria-label={localize('com_ui_rename_prompt_name', { name: group.name })}
                    />
                  }
                  selection={
                    <Button onClick={handleSaveRename} variant="submit">
                      {updateGroup.isLoading ? <Spinner /> : localize('com_ui_save')}
                    </Button>
                  }
                />
              </OGDialog>
            )}
            {canDelete && (
              <OGDialog>
                <OGDialogTrigger asChild>
                  <TooltipAnchor
                    description={localize('com_ui_delete')}
                    side="top"
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        aria-label={localize('com_ui_delete_prompt_name', { name: group.name })}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="size-4 text-text-primary" aria-hidden="true" />
                      </Button>
                    }
                  />
                </OGDialogTrigger>
                <OGDialogTemplate
                  title={localize('com_ui_delete_prompt')}
                  className="w-11/12 max-w-md"
                  main={
                    <Label>{localize('com_ui_prompt_delete_confirm', { 0: group.name })}</Label>
                  }
                  selection={
                    <Button onClick={handleDelete} variant="destructive">
                      {deleteGroup.isLoading ? <Spinner /> : localize('com_ui_delete')}
                    </Button>
                  }
                />
              </OGDialog>
            )}
          </div>
        </ListCard>
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
      <VariableDialog
        open={isVariableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        group={group}
      />
    </>
  );
}

export default memo(ChatGroupItem);
