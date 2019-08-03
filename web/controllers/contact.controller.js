exports.getContact = async (req, res) => {
    const data = {
        ctx: req.ctx
    }

    res.render("contact/contact", data)
}
