import { fetchHelpers } from "../helpers/fetch.helper.js";

export const eventHandlers = {
    handleClickInFilesTbl: async (event) => {
        // Handle 'delete' events
        const target = event.target; // shortcut
        if (target) {
            if (target.classList.contains("delete-file-btn")) {
                const fileId = target.dataset.fileid; // all attribute names are lower case

                const answer = confirm("Ești sigur că vrei să ștergi acest fișier?");
                if (!answer) return;

                const url = `/fisiere/${fileId}`;

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
