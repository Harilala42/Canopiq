import { create } from 'zustand';
import { GeoAnalysis } from '@/types/analysis';

interface AnalyticsState
{
	activeAnalysis: GeoAnalysis | null;
	analyses: Record<string, GeoAnalysis>;

	setAnalyses: (analyses: GeoAnalysis[]) => void;

	setActiveAnalysis: (analysis: GeoAnalysis) => void;

	addAnalysis: (analysis: GeoAnalysis) => void;

	updateAnalysis: (id: string, patch: Partial<GeoAnalysis>) => void;

	getAnalysisById: (id: string) => GeoAnalysis[];

	removeAnalysis: (id: string) => void;
	
	resetAnalyses: () => void;
}

const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
	analyses: {},
	activeAnalysis: null,

	setAnalyses: (analyses) => set({
        analyses: analyses.reduce((acc, analysis) => {
            acc[analysis.id] = analysis;
            return acc;
        }, {} as Record<string, GeoAnalysis>)
    }),

	setActiveAnalysis: (analysis) => set({ activeAnalysis: analysis }),

	addAnalysis: (analysis) =>
		set((state) => ({
			analyses: { ...state.analyses, [analysis.id]: analysis },
			activeAnalysisId: analysis.id,
		})),

	updateAnalysis: (id, patch) =>
		set((state) => ({
			analyses: { ...state.analyses, [id]: { ...state.analyses[id], ...patch } },
		})),

	getAnalysisById: (id) => {
		return Object.values(get().analyses).filter((a) => a.id === id);
	},

	removeAnalysis: (id) =>
		set((state) => {
			const { [id]: _, ...rest } = state.analyses;
			return {
				analyses: rest,
				activeAnalysis: state.activeAnalysis.id === id ? null : state.activeAnalysis,
			};
		}),

	resetAnalyses: () => set({ analyses: {}, activeAnalysis: null }),
}));

export default useAnalyticsStore;
