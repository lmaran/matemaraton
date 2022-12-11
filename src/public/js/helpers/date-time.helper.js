export const dateTimeHelper = {
    /**
     * https://chrisboakes.com/how-a-javascript-debounce-function-works
     * USAGE: document.addEventListener("keyup", dateTimeHelper.debounce(myFunc, 500));
     */
    debounce: (callback, milliseconds) => {
        let timeout;
        return (...args) => {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(
                () => callback.apply(context, args),
                milliseconds
            );
        };
    },

    /**
     * https://stackoverflow.com/a/39914235/2726725
     * Sleep but does not block the thread
     * USAGE: await dateTimeHelper.sleepAsync(500);
     */
    sleepAsync: (milliseconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    },
};
