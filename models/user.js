const mongoose=require("mongoose");
const Schema=mongoose.Schema;
const passportLocalMongoose=require("passport-local-mongoose");


const userSchema=new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    notifications: [
        new mongoose.Schema({
            type: { type: String, required: true },
            message: String,
            listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
            listingOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            isRead: { type: Boolean, default: false },
            responded: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }, { _id: true }) 
    ]
}); 


userSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("User",userSchema);
