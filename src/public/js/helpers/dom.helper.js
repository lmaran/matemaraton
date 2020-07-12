import { dateTimeHelper } from "./date-time.helper.js";

export const domHelper = {
    /**
     * Set in css:
     *  .show {
     *      opacity: 1;
     *  }
     *  .hide {
     *      opacity: 0;
     *      transition: opacity 400ms;
     *  }
     *
     * http://youmightnotneedjquery.com/#fade_out
     */
    showAndFadeOut: async (elem, milliseconds) => {
        elem.classList.add("show");
        elem.classList.remove("hide");

        await dateTimeHelper.sleepAsync(milliseconds); // fade out after x milliseconds (instead of using setTimeout)

        elem.classList.add("hide");
        elem.classList.remove("show");
    },

    /**
     * Automatically expand a textarea as the user types
     * https://gomakethings.com/automatically-expand-a-textarea-as-the-user-types-using-vanilla-javascript/
     */
    autoExpand: field => {
        // Reset field height
        field.style.height = "inherit";

        // Get the computed styles for the element
        const computed = window.getComputedStyle(field);

        // Calculate the height
        const height =
            parseInt(computed.getPropertyValue("border-top-width"), 10) +
            parseInt(computed.getPropertyValue("padding-top"), 10) +
            field.scrollHeight +
            parseInt(computed.getPropertyValue("padding-bottom"), 10) +
            parseInt(computed.getPropertyValue("border-bottom-width"), 10);

        field.style.height = height + "px";
    }
};
