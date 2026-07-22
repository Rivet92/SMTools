import { useEffect, useRef } from 'react';
import {
  Button,
  TextField,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { GenericDialog } from '../GenericDialog';

interface ItemBase {
  id: string;
}

interface CreateRoomModalProps<TItem extends ItemBase> {
  open: boolean;
  onClose: () => void;
  creating: boolean;
  createTitle: string;
  onTitleChange: (v: string) => void;
  createPassword: string;
  onPasswordChange: (v: string) => void;
  onCreate: () => void;
  actionError: string | null;
  onClearError: () => void;
  i18nPrefix: string;
  items?: TItem[];
  selectedItemId?: string | '';
  onItemChange?: (v: string | '') => void;
  getItemLabel?: (item: TItem) => string;
  itemSelectLabelKey?: string;
}

export function CreateRoomModal<TItem extends ItemBase>({
  open,
  onClose,
  creating,
  createTitle,
  onTitleChange,
  createPassword,
  onPasswordChange,
  onCreate,
  actionError,
  onClearError,
  i18nPrefix,
  items,
  selectedItemId,
  onItemChange,
  getItemLabel,
  itemSelectLabelKey,
}: CreateRoomModalProps<TItem>) {
  const { t } = useTranslation();
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => titleInputRef.current?.focus());
    }
  }, [open]);

  return (
    <GenericDialog
      open={open}
      onClose={onClose}
      title={t(`${i18nPrefix}.createRoom`)}
      actions={
        <>
          <Button onClick={onClose}>{t(`${i18nPrefix}.cancel`)}</Button>
          <Button
            variant="contained"
            loading={creating}
            onClick={onCreate}
            disabled={!createTitle.trim()}
          >
            {t(`${i18nPrefix}.create`)}
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 1 }}>
        {actionError && (
          <Alert severity="error" onClose={onClearError}>
            {actionError}
          </Alert>
        )}
        <TextField
          label={t(`${i18nPrefix}.roomTitleLabel`)}
          value={createTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          fullWidth
          inputRef={titleInputRef}
        />
        <TextField
          label={t(`${i18nPrefix}.passwordLabel`)}
          type="password"
          value={createPassword}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onCreate()}
          fullWidth
          helperText={t(`${i18nPrefix}.passwordOptional`)}
        />
        {items &&
          selectedItemId !== undefined &&
          onItemChange &&
          getItemLabel &&
          itemSelectLabelKey && (
            <FormControl fullWidth>
              <InputLabel>{t(itemSelectLabelKey)}</InputLabel>
              <Select
                value={selectedItemId}
                label={t(itemSelectLabelKey)}
                onChange={(e) => onItemChange(e.target.value as string)}
              >
                {items.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {getItemLabel(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
      </Stack>
    </GenericDialog>
  );
}
