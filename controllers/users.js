const mongoose=require("mongoose");
const Listing = require("../models/listing");
const User=require("../models/user.js");
 
module.exports.renderSignupForm=(req,res)=>{
    res.render("users/signup.ejs");
};

module.exports.signup=async(req,res)=>{
    try{
        let {username,email,password}=req.body;
        const newUser=new User({email,username});
        const registeredUser=await User.register(newUser,password);
        console.log(registeredUser);
        req.login(registeredUser,(err)=>{
            if(err){
                return next(err);
            }
            req.flash("success","Welcome to WanderLust");
            res.redirect("/wander");
        });
    }
    catch(err){
        req.flash("error",err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm=(req,res)=>{
    res.render("users/login.ejs"); 
};

module.exports.login=async(req,res)=>{
    req.flash("success","welcome back to WanderLust! ");
    let redirectUrl=res.locals.redirectUrl || "/wander";
    res.redirect(redirectUrl);
};

module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","you are logged out!");
        res.redirect("/wander");
    });
};

const dayjs = require("dayjs"); // (Optional) for formatting
const relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

module.exports.rendernotify = async (req, res) => {
  const user = await User.findById(req.user._id)
     .populate({
        path: "notifications.listing",
        populate: { path: "owner" } // get listing.owner
    })
    .populate("notifications.from")
    .populate("notifications.listingOwner");
  // Convert subdocs to plain objects and expose `fromId` for forms
  const sortedNotifications = user.notifications
    .map((note) => {
      const obj = note.toObject();
      // if 'from' is populated -> take its _id, else it might already be an ObjectId
      obj.fromId = note.from ? (note.from._id ? String(note.from._id) : String(note.from)) : null;
      // Keep listing populated title if available (for better messages)
      obj.listingTitle = note.listing && note.listing.title ? note.listing.title : null;
      return obj;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // timeAgo optional
  sortedNotifications.forEach((note) => {
    note.timeAgo = dayjs(note.createdAt).fromNow();
  });

  res.render("notifications/index", { user, notifications: sortedNotifications });
};


module.exports.notify=async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: { "notifications.$[].isRead": true }
    });
    res.redirect("/wander");
};


module.exports.respondNotification = async (req, res) => {
  try {
    console.log("RESPOND HIT", { params: req.params, body: req.body, user: req.user && req.user._id });

    if (!req.user) {
      req.flash("error", "You must be signed in to perform this action.");
      return res.redirect("/login");
    }

    const ownerId = req.user._id;
    const { noteId } = req.params;
    let { guestId, status } = req.body; // "Accepted" or "Rejected"

    // Basic validation
    if (!noteId || !guestId || !status) {
      req.flash("error", "Missing data for response.");
      return res.redirect("/notifications");
    }

    // Normalize guestId: if somehow an object-string or object got passed, extract 24-hex id
    // This extracts the first 24-char hex string it finds (safe fallback)
    const hexMatch = String(guestId).match(/[a-fA-F0-9]{24}/);
    if (hexMatch) guestId = hexMatch[0];

    // Validate IDs are proper ObjectId strings
    if (!mongoose.Types.ObjectId.isValid(noteId) || !mongoose.Types.ObjectId.isValid(guestId)) {
      req.flash("error", "Invalid IDs provided.");
      return res.redirect("/notifications");
    }

    // 1. Load owner and find the subdocument notification by its _id
    const owner = await User.findById(ownerId);
    if (!owner) {
      req.flash("error", "Owner not found.");
      return res.redirect("/notifications");
    }

    const note = owner.notifications.id(noteId);
    if (!note) {
      req.flash("error", "Notification not found.");
      return res.redirect("/notifications");
    }

    // 2. Mark this owner's notification as read (optional: you may also mark a field like 'responded')
    note.isRead = true;
    note.responded=true;
    await owner.save();
    const displayName=owner.username;
    // 3. Prepare message for guest
    // If note.listing is an ObjectId, we don't have the title here — just include listing id or keep simple message
    let guestMessage;
    if (status === "Accepted" || status.toLowerCase() === "accepted") {
      guestMessage = `✅ Your booking request for the listing has been accepted by the "${displayName}".`;
    } else {
      guestMessage = `❌ Sorry — your booking request was rejected by the "${displayName}".`;
    }

    // 4. Push notification to guest's notifications array
    const guest = await User.findById(guestId);
    if (!guest) {
      req.flash("error", "Guest not found.");
      return res.redirect("/notifications");
    }

    guest.notifications.push({
      type: "booking-response",
      message: guestMessage,
      listing: note.listing || undefined, // store listing id if present
      from: ownerId
      // createdAt will be set by schema default
    });

    await guest.save();
 
    req.flash("success", `Booking ${status.toLowerCase()} and guest notified.`);
    return res.redirect("/notifications");
  } catch (err) {
    console.error("Error in respondNotification:", err);
    req.flash("error", "Something went wrong while responding to the booking.");
    return res.redirect("/notifications");
  }
};