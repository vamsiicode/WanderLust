require("dotenv").config();

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
    initdata.data=initdata.data.map((obj)=>({...obj,owner:'688cd2239005deb25caaa77e',
        geometry: obj.geometry || {
            type: "Point",
            coordinates: [0, 0], // Default/fake coordinates; replace with real ones if available
        },
    }));
    await Listing.insertMany(initdata.data);
    console.log("Data was intialized");
}

initDB();
