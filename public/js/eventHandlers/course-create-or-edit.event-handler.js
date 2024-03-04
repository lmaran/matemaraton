import { sectionService } from "../services/section.service.js";
import { markdownService } from "../services/markdown.service.js";

const editorTxt = document.getElementById("description-editor-txt");
const descriptionPreviewDiv = document.getElementById("description-preview-div");

export const eventHandlers = {
    setDefaultSection: async (event) => {
        event.preventDefault();
        await setDefaultPosition();
    },
    toggleDescriptionEditor: async (event) => {
        event.preventDefault();

        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";
        descriptionPreviewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";
    },
    getDescriptionPreview: async (event) => {
        const data = { markdown: event.target.value };
        descriptionPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
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
