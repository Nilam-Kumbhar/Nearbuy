import dotenv from "dotenv";
import connectDB from "./config/db.js";
import {app} from "./app.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{

    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`sever is running at port : ${process.env.PORT}`);
    })
}) 
.catch((err) => {
    console.log("mongodb connection failed!!!",err);
    
})