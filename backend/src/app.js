import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"})) //accept data from json file
app.use(express.urlencoded({extended:true, limit:"16kb"})) //accepts data from url
// extended - obj in obj nested obj
app.use(express.static("public")) //this used to store img, febicon,pdf data

app.use(cookieParser())

import userRouter from './routes/user.routes.js';

// routes declaration
app.use("/api/v1/users",userRouter)

export {app}