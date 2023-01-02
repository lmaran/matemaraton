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
            displayNumber: 2,
        },
        {
            id: 2,
            name: "Exerciții propuse",
            displayNumber: 3,
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
        {
            id: 4,
            name: "Nivel nespecificat",
        },
    ],
};
