const express=require("express");
const router=express.Router();
const User=require("../models/user.js");
const wrapAsync=require("../utils/wrapAsync.js");
const passport=require("passport");
const userController=require("../controllers/users.js");
const {validateListing,isLoggedIn,isOwner,saveRedirectUrl}=require("../middleware.js");

router
.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));


router
.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl,
    passport.authenticate("local",{failureRedirect:'/login',failureFlash:true}),
    userController.login);


router.get("/logout",userController.logout);


router.get("/notifications", isLoggedIn,wrapAsync(userController.rendernotify));

router.post("/notifications/:noteId/respond", isLoggedIn, wrapAsync(userController.respondNotification));


router.post("/notifications/mark-read", isLoggedIn,wrapAsync(userController.notify));

module.exports=router;
