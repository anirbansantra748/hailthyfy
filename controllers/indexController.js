
const homePage = (req, res) => {
    res.render('home/index.ejs',{user: req.user, error: req.flash("error"), success: req.flash("success")});
}

module.exports = {
    homePage
}
