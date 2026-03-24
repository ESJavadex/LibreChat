import { useState, memo, useRef, useCallback, useEffect, useId, useMemo } from 'react';
import * as Ariakit from '@ariakit/react';
import { useNavigate } from 'react-router-dom';
import { Ellipsis, Eye, Pencil, PenLine, Trash2, EarthIcon, User } from 'lucide-react';
import { PermissionBits, ResourceType } from 'librechat-data-provider';
import type { TPromptGroup } from 'librechat-data-provider';
import {
  Input,
  Label,
  Button,
  Spinner,
  OGDialog,
  DropdownPopup,
  OGDialogTemplate,
  useToastContext,
} from '@librechat/client';
import { useLocalize, useAuthContext, useSubmitMessage, useResourcePermissions } from '~/hooks';
import { useRecordPromptUsage, useDeletePromptGroup, useUpdatePromptGroup } from '~/data-provider';
import { useLiveAnnouncer } from '~/Providers';
import VariableDialog from '../dialogs/VariableDialog';
import PreviewPrompt from '../dialogs/PreviewPrompt';
import CategoryIcon from '../utils/CategoryIcon';
import { detectVariables } from '~/utils';

function ChatGroupItem({ group }: { group: TPromptGroup }) {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { submitPrompt } = useSubmitMessage();
  const recordUsage = useRecordPromptUsage();
  const { showToast } = useToastContext();
  const { announcePolite } = useLiveAnnouncer();

  const menuId = useId();
  const isSharedPrompt = group.author !== user?.id && Boolean(group.authorName);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPreviewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isVariableDialogOpen, setVariableDialogOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  const snippet =
    typeof group.oneliner === 'string' && group.oneliner.length > 0
      ? group.oneliner
      : (group.productionPrompt?.prompt ?? '');

  const ariaLabel = group.category
    ? localize('com_ui_prompt_group_button', { name: group.name, category: group.category })
    : localize('com_ui_prompt_group_button_no_category', { name: group.name });

  const dropdownItems = useMemo(() => {
    const items = [
      {
        label: localize('com_ui_preview'),
        onClick: () => setPreviewDialogOpen(true),
        icon: <Eye className="icon-sm mr-2 text-text-primary" aria-hidden="true" />,
      },
    ];
    if (canEdit) {
      items.push({
        label: localize('com_ui_edit'),
        onClick: () => navigate(`/prompts/${group._id}`),
        icon: <Pencil className="icon-sm mr-2 text-text-primary" aria-hidden="true" />,
      });
      items.push({
        label: localize('com_ui_rename'),
        onClick: () => setRenameOpen(true),
        icon: <PenLine className="icon-sm mr-2 text-text-primary" aria-hidden="true" />,
      });
    }
    if (canDelete) {
      items.push({
        label: localize('com_ui_delete'),
        onClick: () => setDeleteOpen(true),
        icon: <Trash2 className="icon-sm mr-2 text-red-500" aria-hidden="true" />,
      });
    }
    return items;
  }, [localize, canEdit, canDelete, group._id, navigate]);

  return (
    <>
      <div className="group/prompt relative mb-1.5 rounded-xl border border-border-light bg-transparent transition-colors hover:bg-surface-secondary">
        {/* Clickable overlay for card */}
        <button
          type="button"
          className="absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary"
          onClick={onCardClick}
          aria-label={ariaLabel}
        />
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <CategoryIcon
            category={group.category ?? ''}
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-semibold text-text-primary" title={group.name}>
                {group.name}
              </span>
              {isSharedPrompt && (
                <User className="size-3.5 shrink-0 text-text-secondary" aria-hidden="true" />
              )}
              {groupIsGlobal && (
                <EarthIcon className="size-3.5 shrink-0 text-green-400" aria-hidden="true" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
              {snippet}
            </p>
          </div>
          {/* Dropdown menu */}
          <div className="relative z-10 shrink-0">
            <DropdownPopup
              portal={true}
              menuId={menuId}
              focusLoop={true}
              className="z-[125]"
              unmountOnHide={true}
              isOpen={menuOpen}
              setIsOpen={setMenuOpen}
              trigger={
                <Ariakit.MenuButton
                  aria-label={localize('com_nav_convo_menu_options')}
                  className="flex size-7 items-center justify-center rounded-md text-text-secondary opacity-0 transition-opacity hover:bg-surface-hover focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary group-hover/prompt:opacity-100 data-[open]:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Ellipsis className="size-4" aria-hidden="true" />
                </Ariakit.MenuButton>
              }
              items={dropdownItems}
            />
          </div>
        </div>
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
      <OGDialog open={renameOpen} onOpenChange={setRenameOpen}>
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
      <OGDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <OGDialogTemplate
          title={localize('com_ui_delete_prompt')}
          className="w-11/12 max-w-md"
          main={<Label>{localize('com_ui_prompt_delete_confirm', { 0: group.name })}</Label>}
          selection={
            <Button onClick={handleDelete} variant="destructive">
              {deleteGroup.isLoading ? <Spinner /> : localize('com_ui_delete')}
            </Button>
          }
        />
      </OGDialog>
      <VariableDialog
        open={isVariableDialogOpen}
        onClose={() => setVariableDialogOpen(false)}
        group={group}
      />
    </>
  );
}

export default memo(ChatGroupItem);
