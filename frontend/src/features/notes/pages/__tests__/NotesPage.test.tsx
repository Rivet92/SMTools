import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/renderWithProviders';
import type { Note } from '../../../../types/models/notes';
import type { UseMutationResult } from '@tanstack/react-query';

const mockNotes: Note[] = [
  {
    id: 'note-1',
    userId: 'user-1',
    title: 'Meeting Notes',
    content: 'Discuss sprint goals',
    isArchived: false,
    position: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'note-2',
    userId: 'user-1',
    title: 'Ideas',
    content: 'New feature ideas',
    isArchived: false,
    position: 1,
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

const mockMutations = {
  create: { mutateAsync: vi.fn(), isPending: false, error: null, reset: vi.fn() } as unknown as UseMutationResult<Note, Error, { title: string; content: string }>,
  update: { mutateAsync: vi.fn(), isPending: false, error: null, reset: vi.fn() } as unknown as UseMutationResult<Note, Error, { noteId: string; request: { title?: string; content?: string } }>,
  remove: { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, error: null, reset: vi.fn() } as unknown as UseMutationResult<void, Error, string>,
  toggleArchive: { mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() } as unknown as UseMutationResult<Note, Error, string>,
  reorder: { mutate: vi.fn(), isPending: false, error: null, reset: vi.fn() } as unknown as UseMutationResult<void, Error, Array<{ noteId: string; position: number }>>,
};

type NotesData = {
  notes: Note[] | undefined;
  isLoading: boolean;
  error: Error | null;
} & typeof mockMutations;

let mockNotesData: NotesData = {
  notes: mockNotes,
  isLoading: false,
  error: null,
  ...mockMutations,
};

type NoteSelection = {
  selectedNoteId: string | null;
  selectedNote: Note | null;
  selectNote: ReturnType<typeof vi.fn>;
  handleCreateNote: ReturnType<typeof vi.fn>;
  handleDeleteNote: ReturnType<typeof vi.fn>;
};

let mockNoteSelection: NoteSelection = {
  selectedNoteId: null,
  selectedNote: null,
  selectNote: vi.fn(),
  handleCreateNote: vi.fn(),
  handleDeleteNote: vi.fn(),
};

const mockEditor = {
  title: '',
  content: '',
  dirty: false,
  saveStatus: 'idle' as const,
  setTitle: vi.fn(),
  setContent: vi.fn(),
  saveNow: vi.fn(),
  discardChanges: vi.fn(),
};

vi.mock('../../hooks/useNotesData', () => ({
  useNotesData: () => mockNotesData,
}));

vi.mock('../../hooks/useNoteSelection', () => ({
  useNoteSelection: () => mockNoteSelection,
}));

vi.mock('../../hooks/useNoteEditor', () => ({
  useNoteEditor: () => mockEditor,
}));

vi.mock('../../hooks/useNoteDragAndDrop', () => ({
  useNoteDragAndDrop: () => ({
    sensors: [],
    collisionDetection: undefined,
    measuring: undefined,
    activeIds: [],
    archivedIds: [],
    handleDragEnd: vi.fn(),
  }),
}));

vi.mock('../../../../components/feedback/SnackbarProvider', () => ({
  useSnackbar: () => ({
    enqueueSnackbar: vi.fn(),
  }),
}));

import { NotesPage } from '../NotesPage';

describe('NotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNotesData = {
      notes: mockNotes,
      isLoading: false,
      error: null,
      ...mockMutations,
    };
    mockNoteSelection = {
      selectedNoteId: null,
      selectedNote: null,
      selectNote: vi.fn(),
      handleCreateNote: vi.fn(),
      handleDeleteNote: vi.fn(),
    };
  });

  it('renders loading state', () => {
    mockNotesData = { ...mockNotesData, notes: undefined, isLoading: true } as NotesData;
    renderWithProviders(<NotesPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no notes', () => {
    mockNotesData = { ...mockNotesData, notes: [] as Note[] };
    renderWithProviders(<NotesPage />);
    expect(screen.getByText('notes.noNotes')).toBeInTheDocument();
  });

  it('renders note list', () => {
    renderWithProviders(<NotesPage />);
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
  });

  it('shows editor when a note is selected', () => {
    mockNoteSelection = {
      ...mockNoteSelection,
      selectedNoteId: 'note-1',
      selectedNote: mockNotes[0]!,
    };
    mockEditor.title = 'Meeting Notes';
    mockEditor.content = 'Discuss sprint goals';

    renderWithProviders(<NotesPage />);
    expect(screen.getByDisplayValue('Meeting Notes')).toBeInTheDocument();
  });

  it('creates a new note when create button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotesPage />);

    const createButton = screen.getByLabelText('notes.newNote');
    await user.click(createButton);

    expect(screen.getByPlaceholderText('notes.contentPlaceholder')).toBeInTheDocument();
  });

  it('renders error alert when error is present', () => {
    mockNotesData = {
      ...mockNotesData,
      notes: undefined,
      error: new Error('Failed to load notes'),
    } as NotesData;
    renderWithProviders(<NotesPage />);
    expect(screen.getByText('Failed to load notes')).toBeInTheDocument();
  });

  it('renders page title', () => {
    renderWithProviders(<NotesPage />);
    expect(screen.getByText('notes.title')).toBeInTheDocument();
  });
});
