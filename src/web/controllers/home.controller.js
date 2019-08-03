exports.getHomePage = async (req, res) => {
    const data = {
        ctx: req.ctx,
    };
    res.render("home", data);
};
