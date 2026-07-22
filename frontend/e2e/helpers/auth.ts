import { Page } from '@playwright/test';
import type { PagedResponse } from '../../src/types/models/common';
import type { Note } from '../../src/types/models/notes';
import type {
  MyPlanningPokerRoom,
  PlanningPokerDeck,
  PlanningPokerRoomResponse,
} from '../../src/types/models/planning-poker';
import type { MyRetroRoom, RetroTemplate, RetroRoomResponse } from '../../src/types/models/retro';
import type { MyKanbanRoom, KanbanRoomResponse } from '../../src/types/models/kanban';

async function mockApi(page: Page) {
  const createdNotes: Record<string, Note> = {};
  const createdRooms: Record<string, object> = {};

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'e2e-test-user',
        name: 'E2E Test User',
        email: 'e2e@test.local',
        avatarUrl: '',
        provider: 'google',
      }),
    });
  });

  await page.route('**/api/notes**', async (route) => {
    const url = route.request().url();
    const isList = /\/api\/notes$/.test(url) || /\/api\/notes\?/.test(url);
    const match = url.match(/\/api\/notes\/([^/?]+)/);
    const noteId = match?.[1];
    const method = route.request().method();

    if (method === 'GET' && isList) {
      const items = Object.values(createdNotes);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items,
          totalCount: items.length,
          page: 1,
          pageSize: 50,
        } satisfies PagedResponse<Note>),
      });
    } else if (method === 'POST' && isList) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const note: Note = {
        id,
        userId: 'e2e-test-user',
        title: '',
        content: '',
        isArchived: false,
        position: 0,
        createdAt: now,
        updatedAt: now,
      };
      createdNotes[id] = note;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(note satisfies Note),
      });
    } else if ((method === 'PUT' || method === 'PATCH') && noteId) {
      const isArchive = url.includes('/archive');
      if (createdNotes[noteId]) {
        const updates = isArchive
          ? { isArchived: !createdNotes[noteId]!.isArchived }
          : route.request().postDataJSON();
        Object.assign(createdNotes[noteId]!, updates);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createdNotes[noteId] ?? ({} satisfies Note)),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/kanban/rooms', async (route) => {
    if (route.request().method() === 'GET') {
      const items = Object.values(createdRooms).filter(
        (r: Record<string, unknown>) => r._type === 'kanban',
      ) as MyKanbanRoom[];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items,
          totalCount: items.length,
          page: 1,
          pageSize: 50,
        } satisfies PagedResponse<MyKanbanRoom>),
      });
    } else if (route.request().method() === 'POST') {
      const id = crypto.randomUUID();
      const room: KanbanRoomResponse = {
        id,
        title: 'E2E Test Board',
        createdAt: new Date().toISOString(),
        hasPassword: false,
      };
      createdRooms[id] = room;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(room satisfies KanbanRoomResponse),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/planningpoker/rooms', async (route) => {
    if (route.request().method() === 'GET') {
      const items = Object.values(createdRooms).filter(
        (r: Record<string, unknown>) => r._type === 'planningpoker',
      ) as MyPlanningPokerRoom[];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items,
          totalCount: items.length,
          page: 1,
          pageSize: 50,
        } satisfies PagedResponse<MyPlanningPokerRoom>),
      });
    } else if (route.request().method() === 'POST') {
      const id = crypto.randomUUID();
      const room: PlanningPokerRoomResponse = {
        id,
        title: 'E2E Test Room',
        createdAt: new Date().toISOString(),
        deckId: '00000000-0000-0000-0000-000000000001',
        hasPassword: false,
      };
      createdRooms[id] = room;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(room satisfies PlanningPokerRoomResponse),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/planningpoker/decks', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: '00000000-0000-0000-0000-000000000001',
          key: 'fibonacci-sprint',
          isDefault: true,
          cards: [],
        },
      ] satisfies PlanningPokerDeck[]),
    });
  });

  await page.route('**/api/retro/rooms', async (route) => {
    if (route.request().method() === 'GET') {
      const items = Object.values(createdRooms).filter(
        (r: Record<string, unknown>) => r._type === 'retro',
      ) as MyRetroRoom[];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items,
          totalCount: items.length,
          page: 1,
          pageSize: 50,
        } satisfies PagedResponse<MyRetroRoom>),
      });
    } else if (route.request().method() === 'POST') {
      const id = crypto.randomUUID();
      const room: RetroRoomResponse = {
        id,
        title: 'E2E Test Retro',
        createdAt: new Date().toISOString(),
        templateId: 'template-1',
        hasPassword: false,
      };
      createdRooms[id] = room;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(room satisfies RetroRoomResponse),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/retro/templates', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'template-1',
          key: 'mad-sad-glad',
          isDefault: true,
          columns: [
            { id: 'col-1', key: 'mad', displayOrder: 0, color: '#ef4444', icon: 'angry' },
            { id: 'col-2', key: 'sad', displayOrder: 1, color: '#f97316', icon: 'sad' },
            { id: 'col-3', key: 'glad', displayOrder: 2, color: '#22c55e', icon: 'happy' },
          ],
        },
      ] satisfies RetroTemplate[]),
    });
  });
}

export async function mockAuthenticatedUser(page: Page) {
  await mockApi(page);
}

export async function mockUnauthenticatedUser(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
    });
  });
}

export async function loginAsE2eUser(page: Page) {
  const response = await page.request.post('/api/auth/test-login');
  if (!response.ok()) {
    throw new Error(`Test login failed: ${response.status()} ${await response.text()}`);
  }
}
