import { create } from "zustand";

const useBulkStore = create((set) => ({
	filmStructure: "",
	filmLabel: "",
	substrateStructure: "",
	substrateLabel: "",
	setFilmStructure: (file) => set({ filmStructure: file }),
	setSubstrateStructure: (file) => set({ substrateStructure: file }),
	setFilmLabel: (label) => set({ filmLabel: label }),
	setSubstrateLabel: (label) => set({ substrateLabel: label }),
	resetBulk: () =>
		set({
			filmStructure: "",
			substrateStructure: "",
			filmLabel: "",
			substrateLabel: "",
		}),
}));

export default useBulkStore;
