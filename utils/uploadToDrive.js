const { Readable } = require("stream");
const { google } = require("googleapis");
const path = require("path");
const sharp = require("sharp");

const SCOPE = ["https://www.googleapis.com/auth/drive"];

// === Thêm hình vào Google Drive ===
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "../apikey.json"), // Path to service account key file
  scopes: SCOPE,
});

function bufferToStream(buffer) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function makeFilePublic(fileId) {
  try {
    const drive = google.drive({ version: "v3", auth });

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader", // Allows read access
        type: "anyone", // Anyone can access the file
      },
    });

    console.log(`File with ID ${fileId} is now public.`);
  } catch (error) {
    console.error("Error making file public:", error.message);
    throw error;
  }
}

async function resizeImage(fileBuffer, width, height) {
  try {
    const resizedImageBuffer = await sharp(fileBuffer)
      .resize(width, height) // Resize to the given width and height
      .toBuffer();
    return resizedImageBuffer;
  } catch (error) {
    console.error("Error resizing image:", error.message);
    throw error;
  }
}

exports.uploadFileToDrive = async (file, folderId) => {
  try {
    const drive = google.drive({ version: "v3", auth });

    // Resize the image (adjust width and height as needed)
    const resizedBuffer = await resizeImage(file.buffer, 500, 500); // Example size: 500x500

    const fileMetadata = {
      name: file.originalname, // Keep original file name
      parents: ["10Kwt1pqdzyE7rtRvbjkj6-e8lgc_5XQB"], // Folder ID where you want to upload the file
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferToStream(resizedBuffer), // Use resized buffer
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id", // Return the file ID after upload
    });

    const fileId = response.data.id;
    console.log("File ID:", fileId);

    // Make the file public
    await makeFilePublic(fileId);

    return fileId;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error.message);
    throw error;
  }
};
