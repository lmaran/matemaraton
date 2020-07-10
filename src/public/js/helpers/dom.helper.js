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
    }
};
