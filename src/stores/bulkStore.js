import { create } from "zustand";

const useBulkStore = create((set) => ({
	filmStructure: "",
	filmLabel: "",
	substrateStructure: "",
	substrateLabel: "",
	bulkUploaded: false,
	setBulkUploaded: () => set({bulkUploaded: true}),
	setFilmStructure: (data) => set({ filmStructure: data }),
	setSubstrateStructure: (data) => set({ substrateStructure: data }),
	setFilmLabel: (label) => set({ filmLabel: label }),
	setSubstrateLabel: (label) => set({ substrateLabel: label }),
	resetBulk: () =>
		set({
			filmStructure: "",
			substrateStructure: "",
			filmLabel: "",
			substrateLabel: "",
			bulkUploaded: false,
		}),
}));

export default useBulkStore;
