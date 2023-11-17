import { create } from "zustand";

const useMillerStore = create((set) => ({
    maxFilmIndex: "",
    maxSubstrateIndex: "",
    maxArea: "",
    maxStrain: "",
    matchList: [],
    totalMatchImgData: "",
    totalMatchAspectRatio: "auto",
    resetMiller: () => set({
        maxFilmIndex: "",
        maxSubstrateIndex: "",
        maxArea: "",
        maxStrain: "",
        matchList: [],
        totalMatchFigure: "",
        totalMatchAspectRatio: "auto",
    }),
    setMaxFilmIndex: (value) => set({maxFilmIndex: value}),
    setMaxSubstrateIndex: (value) => set({maxSubstrateIndex: value}),
    setMaxArea: (value) => set({maxArea: value}),
    setMaxStrain: (value) => set({maxStrain: value}),
    setMatchList: (data) => set({matchList: data}),
    setTotalMatchImgData: (data) => set({totalMatchImgData: data}),
    setTotalMatchAspectRatio: (ratio) => set({totalMatchAspectRatio: ratio})
}));

export default useMillerStore;
