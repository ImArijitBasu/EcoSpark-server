import multer from 'multer';
import { Request } from 'express';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary';

// Multer memory storage - files stored as buffers
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 5, // Max 5 files
  },
});

/**
 * Upload a buffer to Cloudinary and return the secure URL
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = 'ecospark'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadMultipleToCloudinary(
  files: Express.Multer.File[],
  folder: string = 'ecospark/ideas'
): Promise<string[]> {
  const uploadPromises = files.map((file) => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploadPromises);
}
