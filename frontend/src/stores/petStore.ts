import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pet, PetStage, PetMood, Title, Achievement } from '@/types/index';
import { petApi } from '@services/api';

// Evolution thresholds matching backend
const EVOLUTION_THRESHOLDS = {
  egg: 0,
  baby: 30,
  child: 100,
  teen: 300,
  adult: 600,
};

const getMaxGrowthForStage = (stage: PetStage): number => {
  switch (stage) {
    case 'egg': return EVOLUTION_THRESHOLDS.baby;
    case 'baby': return EVOLUTION_THRESHOLDS.child;
    case 'child': return EVOLUTION_THRESHOLDS.teen;
    case 'teen': return EVOLUTION_THRESHOLDS.adult;
    case 'adult': return EVOLUTION_THRESHOLDS.adult + 1000;
    default: return EVOLUTION_THRESHOLDS.baby;
  }
};

const getPetStage = (growth: number): PetStage => {
  if (growth >= EVOLUTION_THRESHOLDS.adult) return 'adult';
  if (growth >= EVOLUTION_THRESHOLDS.teen) return 'teen';
  if (growth >= EVOLUTION_THRESHOLDS.child) return 'child';
  if (growth >= EVOLUTION_THRESHOLDS.baby) return 'baby';
  return 'egg';
};

interface PetState {
  pet: Pet | null;
  titles: Title[];
  achievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  hasSeenHatch: boolean;
  isHatching: boolean;

  // Actions
  setPet: (pet: Pet | null) => void;
  setLoading: (value: boolean) => void;
  setError: (error: string | null) => void;
  setTitles: (titles: Title[]) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setHasSeenHatch: (value: boolean) => void;
  setIsHatching: (value: boolean) => void;

  // API actions
  fetchPet: () => Promise<void>;
  renamePet: (name: string) => Promise<void>;
  interactWithPet: () => Promise<void>;
  hatchPet: (name: string) => Promise<void>;

  // Pet interactions
  feedPet: (amount: number) => void;
  addGrowth: (growth: number) => void;
  evolvePet: () => void;
  changeMood: (mood: PetMood) => void;
  healPet: (amount: number) => void;
  equipAccessory: (accessoryId: string) => void;
  unequipAccessory: (accessoryId: string) => void;
  changeTitle: (titleId: string | null) => void;
  unlockTitle: (titleId: string) => void;
  unlockAchievement: (achievementId: string) => void;
  toggleSleep: () => void;

  // Computed
  getStageProgress: () => number;
  getNextStageName: () => string;
  canEvolve: () => boolean;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      pet: null,
      titles: [],
      achievements: [],
      isLoading: false,
      error: null,
      hasSeenHatch: false,
      isHatching: false,

      setPet: (pet) => set({ pet }),
      setLoading: (value) => set({ isLoading: value }),
      setError: (error) => set({ error }),
      setTitles: (titles) => set({ titles }),
      setAchievements: (achievements) => set({ achievements }),
      setHasSeenHatch: (value) => set({ hasSeenHatch: value }),
      setIsHatching: (value) => set({ isHatching: value }),

      // Fetch pet from API
      fetchPet: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await petApi.getPet();
          if (response.success && response.data) {
            // Convert API response to Pet type
            const apiPet = response.data as unknown as {
              id: string;
              name: string;
              stage: PetStage;
              growth: number;
              maxGrowth: number;
              bodyType: 'slim' | 'normal' | 'chubby';
              colorPalette: string[];
              accessories: string[];
              mood: PetMood;
              health: number;
              nextEvolution: number;
              lastFed: string | null;
            };

            const pet: Pet = {
              id: apiPet.id,
              name: apiPet.name,
              stage: apiPet.stage,
              growth: apiPet.growth,
              maxGrowth: apiPet.maxGrowth,
              bodyType: apiPet.bodyType,
              colorPalette: apiPet.colorPalette || ['#74B9FF', '#55EFC4'],
              accessories: apiPet.accessories || [],
              mood: apiPet.mood,
              health: apiPet.health,
              nextEvolution: apiPet.nextEvolution,
              lastFed: apiPet.lastFed,
            };
            set({ pet, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch pet',
            isLoading: false,
          });
        }
      },

      // Rename pet via API
      renamePet: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          await petApi.rename(name);
          const { pet } = get();
          if (pet) {
            set({ pet: { ...pet, name }, isLoading: false });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to rename pet',
            isLoading: false,
          });
        }
      },

      // Interact with pet via API
      interactWithPet: async () => {
        set({ isLoading: true, error: null });
        try {
          await petApi.interact();
          const { pet, changeMood } = get();
          if (pet) {
            changeMood('happy');
          }
          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to interact with pet',
            isLoading: false,
          });
        }
      },

      // Hatch a new pet
      hatchPet: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          const newPet: Pet = {
            id: crypto.randomUUID(),
            name: name || '小水滴',
            stage: 'baby',
            growth: 30,
            maxGrowth: getMaxGrowthForStage('baby'),
            bodyType: 'normal',
            colorPalette: ['#74B9FF', '#55EFC4'],
            accessories: [],
            mood: 'happy',
            health: 100,
            nextEvolution: 70,
            lastFed: new Date().toISOString(),
          };
          set({ pet: newPet, isLoading: false, hasSeenHatch: true, isHatching: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to hatch pet',
            isLoading: false,
          });
        }
      },

      feedPet: (amount) =>
        set((state) => {
          if (!state.pet) return state;
          const newHealth = Math.min(100, state.pet.health + amount / 20);
          const growthIncrease = Math.floor(amount / 10);
          const newGrowth = state.pet.growth + growthIncrease;
          const newStage = getPetStage(newGrowth);
          const newMaxGrowth = getMaxGrowthForStage(newStage);

          return {
            pet: {
              ...state.pet,
              health: newHealth,
              growth: newGrowth,
              stage: newStage,
              maxGrowth: newMaxGrowth,
              mood: newHealth > 70 ? 'happy' : newHealth > 40 ? 'normal' : 'thirsty',
              lastFed: new Date().toISOString(),
              nextEvolution: Math.max(0, newMaxGrowth - newGrowth),
            },
          };
        }),

      addGrowth: (growth) =>
        set((state) => {
          if (!state.pet) return state;
          const newGrowth = state.pet.growth + growth;
          const newStage = getPetStage(newGrowth);
          const newMaxGrowth = getMaxGrowthForStage(newStage);

          return {
            pet: {
              ...state.pet,
              growth: newGrowth,
              stage: newStage,
              maxGrowth: newMaxGrowth,
              nextEvolution: Math.max(0, newMaxGrowth - newGrowth),
            },
          };
        }),

      evolvePet: () =>
        set((state) => {
          if (!state.pet) return state;
          const currentStage = state.pet.stage;
          const stages: PetStage[] = ['egg', 'baby', 'child', 'teen', 'adult'];
          const currentIndex = stages.indexOf(currentStage);

          if (currentIndex >= stages.length - 1) return state;

          const nextStage = stages[currentIndex + 1];
          const newMaxGrowth = getMaxGrowthForStage(nextStage);

          return {
            pet: {
              ...state.pet,
              stage: nextStage,
              maxGrowth: newMaxGrowth,
              nextEvolution: Math.max(0, newMaxGrowth - state.pet.growth),
            },
          };
        }),

      changeMood: (mood) =>
        set((state) => {
          if (!state.pet) return state;
          return {
            pet: {
              ...state.pet,
              mood,
            },
          };
        }),

      healPet: (amount) =>
        set((state) => {
          if (!state.pet) return state;
          return {
            pet: {
              ...state.pet,
              health: Math.min(100, state.pet.health + amount),
            },
          };
        }),

      equipAccessory: (accessoryId) =>
        set((state) => {
          if (!state.pet) return state;
          if (state.pet.accessories.includes(accessoryId)) return state;
          return {
            pet: {
              ...state.pet,
              accessories: [...state.pet.accessories, accessoryId],
            },
          };
        }),

      unequipAccessory: (accessoryId) =>
        set((state) => {
          if (!state.pet) return state;
          return {
            pet: {
              ...state.pet,
              accessories: state.pet.accessories.filter((id) => id !== accessoryId),
            },
          };
        }),

      changeTitle: (titleId) =>
        set((state) => {
          if (!state.pet) return state;
          return {
            pet: {
              ...state.pet,
              currentTitle: titleId,
            },
          };
        }),

      unlockTitle: (titleId) =>
        set((state) => {
          if (!state.pet) return state;
          if (state.pet.unlockedTitles?.includes(titleId)) return state;
          return {
            pet: {
              ...state.pet,
              unlockedTitles: [...(state.pet.unlockedTitles || []), titleId],
            },
          };
        }),

      unlockAchievement: (achievementId) =>
        set((state) => ({
          achievements: state.achievements.map((ach) =>
            ach.id === achievementId && !ach.unlockedAt
              ? { ...ach, unlockedAt: new Date().toISOString() }
              : ach
          ),
        })),

      toggleSleep: () =>
        set((state) => {
          if (!state.pet) return state;
          const newMood = state.pet.mood === 'sleeping' ? 'normal' : 'sleeping';
          return {
            pet: {
              ...state.pet,
              mood: newMood,
            },
          };
        }),

      // Computed helpers
      getStageProgress: () => {
        const { pet } = get();
        if (!pet) return 0;
        const stageGrowth = pet.growth - EVOLUTION_THRESHOLDS[pet.stage];
        const stageMax = pet.maxGrowth - EVOLUTION_THRESHOLDS[pet.stage];
        return Math.min(100, Math.max(0, (stageGrowth / stageMax) * 100));
      },

      getNextStageName: () => {
        const { pet } = get();
        if (!pet) return '';
        const stages: Record<PetStage, string> = {
          egg: '幼年期',
          baby: '成长期',
          child: '少年期',
          teen: '成年期',
          adult: '完全体',
        };
        return stages[pet.stage];
      },

      canEvolve: () => {
        const { pet } = get();
        if (!pet) return false;
        return pet.growth >= pet.maxGrowth && pet.stage !== 'adult';
      },
    }),
    {
      name: 'hydratepet-pet-storage',
      partialize: (state) => ({
        pet: state.pet,
        titles: state.titles,
        achievements: state.achievements,
        hasSeenHatch: state.hasSeenHatch,
      }),
    }
  )
);

// Re-export helpers
export { EVOLUTION_THRESHOLDS, getPetStage, getMaxGrowthForStage };
