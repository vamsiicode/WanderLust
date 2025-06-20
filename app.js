
require("dotenv").config();

const express=require("express");
const app=express();
const mongoose= require("mongoose");
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const expressError=require("./utils/expressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

const dbUrl=process.env.ATLASDB_URL;

async function main(){
   await mongoose.connect(dbUrl);
}

main()
    .then(()=>{
        console.log("Connected to DATABASE");
    })
    .catch((err)=>{
        console.log("Error in connecting DB", err);
    });


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"/views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

app.get('/', (req, res) => {
  res.redirect('/wander');
});

const store=MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error",(err)=>{
    console.log("Error in MONGO session store",err);
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUnintialized:true,
    cookie:{
        expires:Date.now()+1000*60*60*24*7,
        maxAge:1000*60*60*24*7,
        httpOnly:true,
    }
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
// Think of it like turning on the Passport engine — no Passport features will work unless this is called.
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); 
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    next();
});


app.use("/wander",listingRouter);
app.use("/wander/:id/reviews",reviewRouter);
app.use("/",userRouter);



app.all("*",(req,res,next)=>{
    next(new expressError(404,"Page not found")); 
});

app.use((err,req,res,next)=>{
    let {statusCode=505,message="something went wrong"}=err;
    res.status(statusCode).send(message);
});


app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});
