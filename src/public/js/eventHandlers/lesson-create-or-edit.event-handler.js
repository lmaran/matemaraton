import { markdownService } from "../services/markdown.service.js";
import { fetchHelpers } from "../helpers/fetch.helper.js";

export const eventHandlers = {
    toggleTheoryEditor: async (event) => {
        event.preventDefault();

        const editorTxt = document.getElementById("theory-editor-txt");
        editorTxt.classList.toggle("d-none");

        const editorIsHide = editorTxt.classList.contains("d-none");
        event.target.textContent = editorIsHide ? "Editează" : "Ascunde";

        const previewDiv = document.getElementById("theory-preview-div");
        previewDiv.style.borderTopStyle = editorIsHide ? "solid" : "dashed";

        const editMenuTheoryLeft = document.getElementById("edit-menu-theory-left");
        editMenuTheoryLeft.classList.toggle("d-none");

        const editMenuTheoryRight = document.getElementById("edit-menu-theory-right");
        editMenuTheoryRight.classList.toggle("d-none");
    },
    getTheoryPreview: async (event) => {
        const data = { markdown: event.target.value };
        const theoryPreviewDiv = document.getElementById("theory-preview-div");
        theoryPreviewDiv.innerHTML = await markdownService.getRenderedMarkdown(data);
    },

    // TODO refactor (remove duplicate codes, see Exercise)
    handleClickInGallery: async (event) => {
        // Handle 'delete' events
        const target = event.target; // shortcut
        if (target) {
            if (target.classList.contains("delete-file-btn")) {
                const fileId = target.dataset.fileid; // all attribute names are lower case

                const editorTxt = document.getElementById("theory-editor-txt");
                if (editorTxt.value.includes(fileId))
                    return alert(`Fișierul cu id ${fileId} nu poate fi șters fiindcă apare în secțiunea de teorie.`);

                const answer = confirm("Ești sigur că vrei să ștergi acest fișier?");
                if (!answer) return;

                const lessonId = document.getElementById("lessonId").value; // empty in edit mode

                const url = lessonId ? `/lectii/${lessonId}/fisiere/${fileId}` : `/lectii/fisiere/${fileId}`;

                const [error, response] = await fetchHelpers.delete(url);
                if (error) {
                    alert(response.message);
                    return;
                }

                // Remove the element from DOM (ES6 way)
                const parentDiv = target.closest("tr"); // find the closest ancestor which matches the selectors
                parentDiv.remove();
            }
        }
    },
};
