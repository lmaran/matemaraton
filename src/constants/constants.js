module.exports = {
    availableExerciseTypes: [
        { text: "Cu răspuns deschis", value: "1" },
        { text: "Cu răspuns tip grilă (selecție unică)", value: "2" },
        { text: "Cu răspuns exact (tip numeric)", value: "3" },
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

    imageExtensions: ["png", "svg", "jpeg", "jpg"],
};
