// file upload
import dotenv from "dotenv";
import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

dotenv.config({ path: "./.env" });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null 
        // upload file on clodinary
        const response=await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("file is uoploaded ",Response.url); //optional it is for us to know info
        fs.unlinkSync(localFilePath)
        return response //for user
        
    }catch (error){
        fs.unlinkSync(localFilePath) 
        //remove locally saved file as the upload operation got failed
        // console.log("Cloudinary Error:", error);
        return null;
    }
}


export {uploadOnCloudinary}