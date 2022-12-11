// import { exerciseService } from "./exercise.service.js";
// import { domHelper } from "../helpers/dom.helper.js";

/**
 * DOM elements
 */

/**
 * event handlers (alias 'controller')
 */
export const eventHandlers = {
    setPageSize: async (event) => {
        const selectedPageSize = event.target.value;

        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set("limit", selectedPageSize);

        // reset also the page number
        searchParams.set("page", 1);

        window.location.search = searchParams.toString();
    },
    handleClickForAllPaginationButttons: async (event) => {
        event.preventDefault();
        let target = event.target; // shortcut

        if (target.tagName === "I") {
            // if click on icon, bubble up to the parent button
            target = event.target.closest("BUTTON"); // find the closest ancestor which matches the selectors
        }

        if (target) {
            const page = target.dataset.page;
            if (page) {
                const searchParams = new URLSearchParams(
                    window.location.search
                );
                searchParams.set("page", page);

                window.location.search = searchParams.toString(); // redirect to url
            }
        }
    },
};
