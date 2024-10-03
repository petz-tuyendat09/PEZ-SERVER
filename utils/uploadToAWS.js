const { S3Client, PutObjectCommand,DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

// Cấu hình AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function resizeImage(fileBuffer) {
  try {
    const resizedImageBuffer = await sharp(fileBuffer)
      .resize(500, 500) // Resize đến kích thước mong muốn
      .toFormat("png", {
        compressionLevel: 9, // Cấp độ nén từ 0 đến 9, 9 là nén tối đa
        adaptiveFiltering: true, // Tối ưu hóa nén
      })
      .toBuffer();
    return resizedImageBuffer;
  } catch (error) {
    console.error("Error resizing image:", error.message);
    throw error;
  }
}

const uploadFileToS3 = async (file) => {
  const resizedImageBuffer = await resizeImage(file.buffer);

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${uuidv4()}-${file.originalname}`, // Tạo tên file duy nhất
    Body: resizedImageBuffer.buffer, // Buffer của file
    ContentType: file.mimetype, // MIME type
    ACL: "public-read", // Quyền truy cập công khai
  };

  try {
    // Sử dụng PutObjectCommand để upload file
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
    return fileUrl;
  } catch (error) {
    console.error("Lỗi khi upload file lên S3:", error);
    throw error;
  }
};

const deleteFileFromS3 = async (fileKey) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileKey, // Đường dẫn tới file trong bucket
  };

  try {
    const command = new DeleteObjectCommand(params);
    const data = await s3.send(command);
    console.log(`File ${fileKey} đã được xóa khỏi S3.`);
    return data;
  } catch (error) {
    console.error("Lỗi khi xóa file khỏi S3:", error);
    throw error;
  }
};

module.exports = { uploadFileToS3,deleteFileFromS3 };
