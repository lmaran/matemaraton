export const urlHelper = {
    /**
     * Input: http://www.example.com/dir/file.html
     * Output: file
     * Source: https://stackoverflow.com/a/17143667
     */
    getFilenameFromUrl: (url) => {
        const filename = url.split("/").pop();
        return filename;
    },

    /**
     * Input: http://www.example.com/dir/file.html
     * Output: file.html
     * Source: https://stackoverflow.com/a/47956767
     */
    getFilenameWithoutExtensionFromUrl: (url) => {
        const filename = urlHelper.getFilenameFromUrl(url);
        const filenameWithoutExtension = filename.substring(0, filename.lastIndexOf(".")) || filename;
        return filenameWithoutExtension;
    },
};
