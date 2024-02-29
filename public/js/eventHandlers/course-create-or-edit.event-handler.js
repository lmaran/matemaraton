import { sectionService } from "../services/section.service.js";

export const eventHandlers = {
    setDefaultSection: async (event) => {
        event.preventDefault();
        await setDefaultPosition();
    },
};

const setDefaultPosition = async () => {
    const sectionId = document.getElementById("sectionSelect").value;
    const positionSelect = document.getElementById("positionSelect");
    const courseId = document.getElementById("courseId").value;

    const { availablePositions, selectedPosition } = await sectionService.getAvailablePositions({ sectionId, courseId });

    // PositionSelect: remove all options
    while (positionSelect.options.length) positionSelect.remove(0);

    // PositionSelect: insert the new options
    availablePositions.forEach((x) => {
        positionSelect.add(new Option(x.name, x.index));
    });

    // Set the selected position as default
    positionSelect.value = selectedPosition;
};
