const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const Listing= require("../models/listing.js");
const {validateListing,isLoggedIn,isOwner,saveRedirectUrl}=require("../middleware.js");
const listingController=require("../controllers/listings");
const multer  = require('multer');
const {storage}=require("../cloudConfig.js");
const upload = multer({storage});


// Index Route
// Create Route
router
.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn,upload.single("listing[image]"),validateListing,
    wrapAsync(listingController.createListing));

router.get("/chat",wrapAsync(async (req, res) => {
    res.render("./listings/chat.ejs"); // Will load chat.ejs
}));

router
.route("/search-listings")
.get(wrapAsync(listingController.searchListing));

// New Route
router.get("/new",isLoggedIn,saveRedirectUrl,listingController.renderNewForm);

// Book Route
router.post("/:id/book",isLoggedIn,wrapAsync(listingController.booking));

// Show Route
// Update Route
// Delete Route
router
.route("/:id")
.get(wrapAsync(listingController.showListing))
.put(isLoggedIn,isOwner,upload.single("listing[image]"),validateListing,wrapAsync(listingController.updateListing))
.delete(isLoggedIn,isOwner,wrapAsync(listingController.destroyListing));
 

// Edit Route
router.get("/:id/edit",isLoggedIn,
    isOwner,wrapAsync(listingController.renderEditForm));


module.exports=router;