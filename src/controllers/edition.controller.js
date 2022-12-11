exports.getEdition = async (req, res) => {
    const editionSegments = req.url.split("-"); // "/edition-3"
    const editionNumber = editionSegments[1];
    const data = {
        editionNumber,
    };
    res.render(`editions/editia-${editionNumber}`, data);
};
