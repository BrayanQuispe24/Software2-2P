import { create } from 'zustand';

interface AuthUiState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useAuthStore = create<AuthUiState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  activeTab: 'overview',
  setActiveTab: (tab: string) => set({ activeTab: tab }),
}));
