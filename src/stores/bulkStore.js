import { create } from "zustand";

const useBulkStore = create((set) => ({
	filmStructure: "",
	filmFormula: "",
	filmSpaceGroup: "",
	substrateStructure: "",
	substrateFormula: "",
	substrateSpaceGroup: "",
	bulkUploaded: false,
	bulkOrderedError: false,
	setBulkOrderedError: (value) => set({bulkOrderedError: value}),
	setBulkUploaded: () => set({bulkUploaded: true}),
	setFilmStructure: (data) => set({ filmStructure: data }),
	setSubstrateStructure: (data) => set({ substrateStructure: data }),
	setFilmFormula: (label) => set({ filmFormula: label }),
	setSubstrateFormula: (label) => set({ substrateFormula: label }),
	setFilmSpaceGroup: (label) => set({ filmSpaceGroup: label }),
	setSubstrateSpaceGroup: (label) => set({ substrateSpaceGroup: label }),
	resetBulk: () =>
		set({
			filmStructure: "",
			filmFormula: "",
			filmSpaceGroup: "",
			substrateStructure: "",
			substrateFormula: "",
			substrateSpaceGroup: "",
			bulkUploaded: false,
			bulkUploadError: false,
		}),
}));

export default useBulkStore;
