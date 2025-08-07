const AWS = require('aws-sdk');

// Configure AWS SDK for Cloudflare R2
const s3 = new AWS.S3({
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || 'https://cba181917631aaa04d3d436487c2cb01.r2.cloudflarestorage.com',
  accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  region: 'auto', // R2 doesn't use regions like S3
  signatureVersion: 'v4'
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'prepexam';
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-f1d10adfe2ee47dc847edaf17de2a7d1.r2.dev';

// Upload file to R2
const uploadToR2 = async (file, key, contentType) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return {
      success: true,
      url: `${PUBLIC_URL}/${key}`,
      key: key
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from R2
const deleteFromR2 = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Error deleting from R2:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Generate unique key for file
const generateFileKey = (originalName, prefix = 'questions') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${prefix}/${timestamp}-${randomString}.${extension}`;
};

module.exports = {
  uploadToR2,
  deleteFromR2,
  generateFileKey,
  PUBLIC_URL
}; 