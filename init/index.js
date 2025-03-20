const mongoose=require("mongoose");
const initdata=require("./data.js");
const Listing=require("../models/listing.js");


const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(()=>{
        console.log("conneced to DATABASE");
    })
    .catch((err)=>{
        console.log(err);
    });



async function main(){
    await mongoose.connect(MONGO_URL);
}

const initDB=async()=>{
    await Listing.deleteMany({});
    initdata.data=initdata.data.map((obj)=>({...obj,owner:'67c70304abc3dace69942960'}));
    await Listing.insertMany(initdata.data);
    console.log("Data was intialized");
}

initDB();
 