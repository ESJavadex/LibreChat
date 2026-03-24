import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { Button, Spinner, TooltipAnchor } from '@librechat/client';
import { useLocalize } from '~/hooks';

type Props = {
  name?: string;
  isLoading?: boolean;
  onSave: (newName: string) => void;
};

const PromptName: React.FC<Props> = ({ name, isLoading = false, onSave }) => {
  const localize = useLocalize();
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  }, []);

  const handleCancel = useCallback(() => {
    if (isLoading) {
      return;
    }
    setIsEditing(false);
    setNewName(name);
  }, [name, isLoading]);

  const saveName = useCallback(() => {
    if (isLoading) {
      return;
    }
    const savedName = newName?.trim();
    if (savedName && savedName !== name) {
      onSave(savedName);
    } else {
      setNewName(name);
      setIsEditing(false);
    }
  }, [newName, name, onSave, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        saveName();
      }
    },
    [handleCancel, saveName],
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    setNewName(name);
    if (wasLoadingRef.current) {
      setIsEditing(false);
      wasLoadingRef.current = false;
    }
  }, [name]);

  return (
    <div className="flex h-10 min-w-0 flex-1 items-center">
      {isEditing ? (
        <div className="flex h-10 min-w-0 flex-1 items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newName ?? ''}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={saveName}
            disabled={isLoading}
            className="h-10 min-w-0 flex-1 rounded-lg border border-border-medium bg-transparent px-0 text-xl font-semibold text-text-primary outline-none transition-colors focus:border-border-medium disabled:opacity-60 sm:text-2xl"
            aria-label={localize('com_ui_name')}
          />
          <div className="flex shrink-0 items-center gap-1">
            <TooltipAnchor
              description={isLoading ? localize('com_ui_loading') : localize('com_ui_save')}
              side="bottom"
              render={
                <Button
                  type="button"
                  onClick={saveName}
                  variant="submit"
                  size="icon"
                  disabled={isLoading}
                  className="size-7"
                  aria-label={isLoading ? localize('com_ui_loading') : localize('com_ui_save')}
                >
                  {isLoading ? (
                    <Spinner size={14} className="text-white" />
                  ) : (
                    <Check className="size-3.5" aria-hidden="true" />
                  )}
                </Button>
              }
            />
            <TooltipAnchor
              description={localize('com_ui_cancel')}
              side="bottom"
              render={
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  size="icon"
                  disabled={isLoading}
                  className="size-7"
                  aria-label={localize('com_ui_cancel')}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <>
          <span
            className="block min-w-0 flex-1 truncate text-xl font-semibold text-text-primary sm:text-2xl"
            title={newName}
          >
            {newName}
          </span>
          <TooltipAnchor
            description={localize('com_ui_rename')}
            side="bottom"
            render={
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="icon"
                className="ml-2 size-7 shrink-0"
                aria-label={localize('com_ui_rename')}
              >
                <Pencil className="size-3.5 text-text-tertiary" aria-hidden="true" />
              </Button>
            }
          />
        </>
      )}
    </div>
  );
};

export default PromptName;
