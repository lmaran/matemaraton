/**
 * input: ontent (svg format) and scaleRatio (default 80%)
 * output: the new svg content
 * note: we only change some attributes in the XML structure (the actual size remains the same)
 */
exports.resizeSvg = (content, scaleRatio) => {
    // We need only the first element
    const endOfFirstElementIdx = content.indexOf(">");
    const firstElement = content.substring(0, endOfFirstElementIdx + 1); // `<svg version="1.1" xmlns="..." xmlns:xlink="..." width="303" height="362" viewBox="0 0 303 362">`
    // const firstElement = `<svg version="1.1" xmlns="..." xmlns:xlink="..." width="303" height="362" viewBox="0 0 303 362">`; // for testing

    let width = null,
        height = null,
        viewBox = null;

    const viewBoxAttributeIdx = firstElement.indexOf('viewBox="');
    const viewBoxStartIdx = viewBoxAttributeIdx + 9; // viewBox=" has 9 ch
    if (viewBoxAttributeIdx != -1) {
        // If there is a viewBox attribute, get the original with and height from there
        const viewBoxEndIdx = firstElement.indexOf('"', viewBoxStartIdx);
        viewBox = firstElement.substring(viewBoxStartIdx, viewBoxEndIdx);

        const viewBoxArray = viewBox.split(" "); // 0 0 303 362
        if (viewBoxArray && viewBoxArray.length == 4) {
            width = viewBoxArray[2];
            height = viewBoxArray[3];
        }
    } else {
        // Get the original with and height from the "width" and "height" attributes
        const widthStartIdx = firstElement.indexOf('width="') + 7; // width=" has 7 ch
        const widthEndIdx = firstElement.indexOf('"', widthStartIdx);
        width = firstElement.substring(widthStartIdx, widthEndIdx);

        const heightStartIdx = firstElement.indexOf('height="') + 8; // height=" has 8 ch
        const heightEndIdx = firstElement.indexOf('"', heightStartIdx);
        height = firstElement.substring(heightStartIdx, heightEndIdx);
    }

    // Calculate the new values
    const newWidth = Math.floor((scaleRatio * width) / 100);
    const newHeight = Math.floor((scaleRatio * height) / 100);

    // Save the new values.
    let newFirstElement = firstElement.replace(`width="${width}"`, `width="${newWidth}"`);
    newFirstElement = newFirstElement.replace(`height="${height}"`, `height="${newHeight}"`);

    if (viewBoxAttributeIdx == -1) {
        // The viewBox keeps the initial size. Is not present, we have to add it
        const endOfNewFirstElementIdx = newFirstElement.indexOf(">");
        const viewBoxStr = ` viewBox="0 0 ${width} ${height}"`;
        newFirstElement = newFirstElement.substring(0, endOfNewFirstElementIdx) + viewBoxStr + ">";
    }

    // Replace the first element with the new one
    const newEndOfFirstElementIdx = content.indexOf(">");
    content = newFirstElement + content.substring(newEndOfFirstElementIdx + 1);

    return content;
};
