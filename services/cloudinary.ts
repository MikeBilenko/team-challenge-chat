import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
import { existsSync, mkdirSync, writeFile } from 'fs';
import path from "path";
import { generateRandomCode } from '../helpers/generateRandomCode';

const temporaryFolder = "/tmp/upload";

dotenv.config()

cloudinary.config({ 
  cloud_name: 'dtonpxhk7', 
  api_key: '325515328154224', 
  api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});
    
export const uploadToCloudinary = async (file: any) => {
  const name = generateRandomCode();
  if (!existsSync(temporaryFolder)){
    mkdirSync(temporaryFolder, { recursive: true });
  }
  writeFile(path.join(temporaryFolder, name), file, (err) => {
    console.log({ message: err ? err : "success writing file" });
  });
  let uploadError: any;
  const image = await cloudinary.uploader
    .upload(
      path.join(temporaryFolder, name), {
        public_id: name,
      }
    )
    .catch((error) => {
      console.log(error);
      uploadError = error;
    });

  // const optimizeUrl = cloudinary.url(name, {
  //     fetch_format: 'auto',
  //     quality: 'auto'
  // });
  if (image) {
    return image!.url;
  } else {
    if (uploadError) {
      throw new Error(uploadError.message);
    } else {
      throw new Error("Unknown error uploading to cloudinary");
    }
  }
}