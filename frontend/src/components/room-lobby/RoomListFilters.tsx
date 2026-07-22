import {
  Box,
  Button,
  Collapse,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { IconFilter, IconFilterOff, IconSearch } from '@tabler/icons-react';

interface RoomListFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  ownerOnly: boolean;
  onOwnerOnlyChange: (value: boolean) => void;
  adminOnly: boolean;
  onAdminOnlyChange: (value: boolean) => void;
  labels: {
    searchPlaceholder: string;
    fromDate: string;
    toDate: string;
    ownerOnly: string;
    adminOnly: string;
  };
}

export function RoomListFilters({
  search,
  onSearchChange,
  showFilters,
  onToggleFilters,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  ownerOnly,
  onOwnerOnlyChange,
  adminOnly,
  onAdminOnlyChange,
  labels,
}: RoomListFiltersProps) {
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <Box component="span" sx={{ display: 'flex', color: 'text.secondary', mr: 0.5 }}>
                  <IconSearch size={18} />
                </Box>
              ),
            },
          }}
        />
        <Button
          variant={showFilters ? 'contained' : 'outlined'}
          size="small"
          onClick={onToggleFilters}
          sx={{ minWidth: 40, px: 1, height: 40 }}
        >
          {showFilters ? <IconFilterOff size={22} /> : <IconFilter size={22} />}
        </Button>
      </Stack>

      <Collapse in={showFilters}>
        <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              label={labels.fromDate}
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={labels.toDate}
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControlLabel
              control={
                <Switch checked={ownerOnly} onChange={(e) => onOwnerOnlyChange(e.target.checked)} />
              }
              label={labels.ownerOnly}
            />
            <FormControlLabel
              control={
                <Switch checked={adminOnly} onChange={(e) => onAdminOnlyChange(e.target.checked)} />
              }
              label={labels.adminOnly}
            />
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
}
