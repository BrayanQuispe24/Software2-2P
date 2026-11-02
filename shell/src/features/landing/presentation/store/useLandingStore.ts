import { create } from 'zustand';

interface LandingState {
  isBookingModalOpen: boolean;
  selectedPlanTitle: string;
  selectedPlanPrice: string;
  activeRoleTab: string;
  mobileNavOpen: boolean;
  openBookingModal: (planTitle?: string, price?: string) => void;
  closeBookingModal: () => void;
  setActiveRoleTab: (tab: string) => void;
  toggleMobileNav: (force?: boolean) => void;
}

export const useLandingStore = create<LandingState>((set) => ({
  isBookingModalOpen: false,
  selectedPlanTitle: 'Clase de Prueba de Cortesía',
  selectedPlanPrice: 'Gratis / 1 Día',
  activeRoleTab: 'socio',
  mobileNavOpen: false,

  openBookingModal: (planTitle = 'Clase de Prueba de Cortesía', price = 'Gratis / 1 Día') =>
    set({
      isBookingModalOpen: true,
      selectedPlanTitle: planTitle,
      selectedPlanPrice: price,
    }),

  closeBookingModal: () =>
    set({
      isBookingModalOpen: false,
    }),

  setActiveRoleTab: (tab) =>
    set({
      activeRoleTab: tab,
    }),

  toggleMobileNav: (force) =>
    set((state) => ({
      mobileNavOpen: force !== undefined ? force : !state.mobileNavOpen,
    })),
}));
