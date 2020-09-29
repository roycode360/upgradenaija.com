module.exports = {
  // user auth
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "You need to log in");
    res.redirect("/users/login");
  },
  forwardAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/dashboard");
  },

  //admin auth
  preAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "Please log in");
    res.redirect("/admin/login");
  },
  postAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/admin");
  },
  // pledge auth
  checkAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("error_msg", "You need to be logged in!");
    res.redirect("/admin/login");
  },
  whenAuthenticated: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect("/pledge");
  },
};