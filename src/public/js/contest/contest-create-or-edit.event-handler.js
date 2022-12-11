/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    setDefaultContestName: async (event) => {
        const selectedContestType = event.target.value;
        const selectedContestName =
            event.target.options[event.target.selectedIndex].text;
        const contestNameInput = document.getElementById("contestNameInput");

        switch (selectedContestType) {
            case "olimpiada-locala":
                contestNameInput.value = `${selectedContestName}, <judet>, <anul>`;
                break;
            case "olimpiada-judeteana":
            case "olimpiada-nationala":
                contestNameInput.value = `${selectedContestName}, <anul>`;
                break;
            case "alte-concursuri":
                contestNameInput.value =
                    "Concurs <nume-concurs>, <oras>, <anul>";
                break;
            default:
                contestNameInput.value = "";
        }
    },
};
