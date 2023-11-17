import { create } from "zustand";

const useFileStore = create((set) => ({
    filmFile: "",
    substrateFile: "",
    setFilmFile: (file) => set({filmFile: file}),
    setSubstrateFile: (file) => set({substrateFile: file})
}))

export default useFileStore