import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Pencil } from 'lucide-react';
import { Button, Spinner, TooltipAnchor } from '@librechat/client';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

type Props = {
  name?: string;
  isLoading?: boolean;
  onSave: (newName: string) => void;
};

type SaveStatus = 'idle' | 'saving' | 'saved';

const PromptName: React.FC<Props> = ({ name, isLoading = false, onSave }) => {
  const localize = useLocalize();
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(e.target.value);
  }, []);

  const saveName = useCallback(() => {
    const savedName = newName?.trim();
    if (savedName && savedName !== name) {
      setSaveStatus('saving');
      onSave(savedName);
    } else {
      setNewName(name);
    }
    setIsEditing(false);
  }, [newName, name, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setNewName(name);
        setIsEditing(false);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        saveName();
      }
    },
    [name, saveName],
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isLoading) {
      setSaveStatus('saving');
    } else if (wasLoadingRef.current && !isLoading) {
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    setNewName(name);
  }, [name]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-10 min-w-0 flex-1 items-center gap-2">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={newName ?? ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={saveName}
          disabled={isLoading}
          className="h-10 min-w-0 flex-1 border-b border-border-heavy bg-transparent px-0 text-xl font-semibold text-text-primary outline-none disabled:opacity-60 sm:text-2xl"
          aria-label={localize('com_ui_name')}
        />
      ) : (
        <span
          className="block min-w-0 flex-1 truncate border-b border-transparent text-xl font-semibold text-text-primary sm:text-2xl"
          title={newName}
        >
          {newName}
        </span>
      )}
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={cn(
            'text-xs transition-opacity duration-200',
            saveStatus === 'idle' && 'opacity-0',
            saveStatus === 'saving' && 'text-text-secondary opacity-100',
            saveStatus === 'saved' && 'text-green-500 opacity-100',
          )}
          aria-live="polite"
        >
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1">
              <Spinner size={12} />
              {localize('com_ui_saving')}
            </span>
          )}
          {saveStatus === 'saved' && localize('com_ui_saved')}
        </span>
        {!isEditing && (
          <TooltipAnchor
            description={localize('com_ui_rename')}
            side="bottom"
            render={
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label={localize('com_ui_rename')}
              >
                <Pencil className="size-3.5 text-text-primary" aria-hidden="true" />
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default PromptName;
