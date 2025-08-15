const Listing = require("../models/listing");
const Review = require("../models/review");
const User=require("../models/user");

module.exports.createReview=async(req,res)=>{
    let listing=await Listing.findById(req.params.id);
    let newReview=new Review(req.body.review);
    newReview.author=req.user._id;
    listing.reviews.push(newReview);
    // console.log(newReview);
    const owner = await User.findById(listing.owner._id);
    owner.notifications.push({
        type: "review",
        message: `${req.user.username} reviewed your hotel "${listing.title}"`,
        listing: listing._id
    });
    await owner.save();
    await newReview.save();
    await listing.save();
    req.flash("success","New Review Created!");
    res.redirect(`/wander/${listing._id}`);
};

module.exports.destroyReview=async (req,res)=>{
    let {id,reviewId}=req.params;

    await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
    await Review.findByIdAndDelete(reviewId);

    req.flash("success","Review Deleted!");
    res.redirect(`/wander/${id}`);    
};