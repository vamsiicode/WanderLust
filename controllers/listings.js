
const Listing=require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken= process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

const Booking=require("../models/booking");
const User=require("../models/user");

module.exports.index=async (req,res)=>{
    const allListings=await Listing.find({});
    res.render("./listings/index.ejs",{allListings});
};

module.exports.renderNewForm=(req,res)=>{
    res.render("./listings/new.ejs");
};

module.exports.showListing=async (req,res)=>{
    let {id}=req.params;
    
    const listing=await Listing.findById(id).populate({path:"reviews",populate:{path:"author",}})
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested for does not exist");
        res.redirect("/wander");
    }

    res.render("./listings/show.ejs",{listing});
};

module.exports.createListing=async (req,res,next)=>{
        let response=await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        })
        .send()

        const newListing=new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.geometry=response.body.features[0].geometry;
        if(typeof req.file!="undefined"){
            let url=req.file.path;
            let filename=req.file.filename;
            newListing.image={url,filename};
        }
        await newListing.save();
        req.flash("success","New Listing Created");
        res.redirect("/wander");
    };


module.exports.renderEditForm=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested for does not exist");
        res.redirect("/wander");
    }
    let originalImageUrl=listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/h_300,w_250");

    res.render("./listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing=async (req,res)=>{
    let {id}=req.params;
    let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing}); // deconstruct
    
    if(typeof req.file !== "undefined"){
        let url=req.file.path;
        let filename=req.file.filename;

        console.log(url);
        listing.image={url,filename};
        await listing.save();
    }
    
    req.flash("success","Listing Updated!");
    res.redirect(`/wander/${id}`);
};

module.exports.destroyListing=async (req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success","Listing Deleted!");
    res.redirect("/wander");
};

module.exports.booking=async (req, res) => {
    console.log("✅ Booking route HIT!");
    console.log("🔍 req.user =", req.user);
    const { checkin, checkout, guests } = req.body;
    const listing = await Listing.findById(req.params.id).populate("owner");
    const booking = new Booking({
        user: req.user._id,
        listing: listing._id,
        checkin,
        checkout,
        guests
    }); 
    await booking.save();
    // console.log(`${listing}`);
    // Add notification to the listing owner
    const owner = await User.findById(listing.owner._id);
    owner.notifications.push({
        type: "booking",
        message: `"${req.user.username}" booked your hotel "${listing.title}"`,
        listing: listing._id,
        listingOwner:listing.owner,
        from:req.user._id
    });
    await owner.save();
    console.log("Form values:", req.body);
    req.flash("success", "Booking status is pending");
    res.redirect(`/wander/${listing._id}`);
};

// Search Listings
// controllers/listingController.js
module.exports.searchListing = async (req, res) => {
    try {
        let query = req.query.q || "";
        query = query.trim();

        if (!query) {
            return res.status(400).json({ error: "Missing search query" });
        }

        // Escape regex special characters to avoid breaking search
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const listings = await Listing.find({
            $or: [
                { location: { $regex: escapedQuery, $options: "i" } },
                { title: { $regex: escapedQuery, $options: "i" } },
                { country: { $regex: escapedQuery, $options: "i" } } // optional: more fields
            ]
        });

        res.json(listings);
    } catch (err) {
        console.error("Error searching listings:", err);
        res.status(500).json({ error: "Server error while searching" });
    }
};

