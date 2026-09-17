import cloudinary from "../config/cloudflare.js";

async function GenerateUploadSignature(req, res) {
    try {
        const timestamp = Math.round(Date.now() / 1000);

        const signValues = {
            timestamp,
            folder: "codejudge/editorials"
        };

        const signature = cloudinary.utils.api_sign_request(
            signValues,
            process.env.CLOUDINARY_API_SECRET
        );

        res.status(200).json({
            timestamp,
            signature,
            cloudname: process.env.CLOUDINARY_CLOUD_NAME,
            apikey: process.env.CLOUDINARY_API_KEY,
            folder: "codejudge/editorials"
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

export default {GenerateUploadSignature};