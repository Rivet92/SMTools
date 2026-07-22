import { create } from 'zustand';

interface NavigationState {
  breadcrumbRoomTitle: string | null;
  setBreadcrumbRoomTitle: (title: string | null) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  breadcrumbRoomTitle: null,
  setBreadcrumbRoomTitle: (title) => set({ breadcrumbRoomTitle: title }),
}));
