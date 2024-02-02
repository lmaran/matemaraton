module.exports = {
    availableExerciseTypes: [
        { text: "Cu răspuns deschis", value: "1" },
        { text: "Cu răspuns tip grilă (selecție unică)", value: "2" },
        { text: "Cu răspuns exact (tip numeric)", value: "3" },
    ],

    availableSections: [
        {
            id: 1,
            name: "Exerciții rezolvate",
        },
        {
            id: 2,
            name: "Exerciții propuse",
        },
    ],

    availableLevels: [
        {
            id: 1,
            name: "Nivel introductiv",
        },
        {
            id: 2,
            name: "Nivel mediu",
        },
        {
            id: 3,
            name: "Nivel avansat",
        },
    ],

    availableSheetTypes: [
        { text: "Material teoretic", value: "1" },
        { text: "Exerciții rezolvate", value: "2" },
        { text: "Temă individuală", value: "3" },
    ],

    imageExtensions: ["png", "svg", "jpeg", "jpg"],
};