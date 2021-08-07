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

    applyColorGreenTransition: async (elem, milliseconds) => {
        elem.classList.add("show-green");
        elem.classList.remove("hide-green");

        await dateTimeHelper.sleepAsync(milliseconds); // fade out after x milliseconds (instead of using setTimeout)

        elem.classList.remove("show-green");
        elem.classList.add("hide-green");
    },

    /**
     * @param {String} HTML representing a single element
     * @return {Element}
     * https://stackoverflow.com/a/35385518
     * ex: var div = htmlToElement('<div><span>nested</span> <span>stuff</span></div>');s
     */
    htmlToElement: (html) => {
        const template = document.createElement("template");
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    },

    /**
     * @param {String} HTML representing any number of sibling elements
     * @return {NodeList}
     * https://stackoverflow.com/a/35385518
     * ex: var rows = htmlToElements('<tr><td>foo</td></tr><tr><td>bar</td></tr>');
     */
    htmlToElements: (html) => {
        const template = document.createElement("template");
        template.innerHTML = html;
        return template.content.childNodes;
    },

    /**
     * Automatically expand a textarea as the user types
     * https://gomakethings.com/automatically-expand-a-textarea-as-the-user-types-using-vanilla-javascript/
     *
     * Note: It works fine for small text, but annoying behavior for large text
     *
     * Usage:
     * document.addEventListener("input", eventHandlers.autoExpandAllTextareas);
     * document.addEventListener("click", eventHandlers.autoExpandAllTextareas);
     *
     * autoExpandAllTextareas: async (event) => {
     *    if (event.target.tagName.toLowerCase() === "textarea") {
     *       domHelper.autoExpand(event.target);
     * }}
     */
    autoExpand: (field) => {
        // Reset field height
        field.style.height = "inherit";

        // Get the computed styles for the element
        const computed = window.getComputedStyle(field);

        // Calculate the height
        let height =
            parseInt(computed.getPropertyValue("border-top-width"), 10) +
            parseInt(computed.getPropertyValue("padding-top"), 10) +
            field.scrollHeight +
            parseInt(computed.getPropertyValue("padding-bottom"), 10) +
            parseInt(computed.getPropertyValue("border-bottom-width"), 10);

        height = height - 12; // my correction (l.m.)

        field.style.height = height + "px";
    },
};
