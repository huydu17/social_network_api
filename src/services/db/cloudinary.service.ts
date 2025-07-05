import cloudinary from 'cloudinary';
import { appConfig } from 'src/config/appConfig';
import { BadRequestException } from 'src/middlewares/globalErrorHandle';
import { removeTmp } from 'src/utils/removeTmp';

export interface UploadedFile {
  name: string;
  data: Buffer;
  encoding: string;
  tempFilePath: string;
  truncated: boolean;
  mimetype: string;
  md5: string;
}

class CloudinaryService {
  constructor() {
    appConfig.cloudinary();
  }
  public async upload(fileInput: UploadedFile | UploadedFile[], nameFolder: string) {
    try {
      if (Array.isArray(fileInput)) {
        const images: any = [];
        for (const file of fileInput) {
          const response = await this.uploadFileCloudinary(file?.tempFilePath, nameFolder);
          images.push(response);
          await removeTmp(file.tempFilePath);
        }
        return images;
      } else if (fileInput) {
        const response = await this.uploadFileCloudinary(fileInput?.tempFilePath, nameFolder);
        await removeTmp(fileInput.tempFilePath);
        return response;
      }
    } catch (err: any) {
      throw new BadRequestException('Lỗi khi upload');
    }
  }
  public async delete(public_id: string) {
    try {
      await cloudinary.v2.uploader.destroy(public_id);
      return true;
    } catch (err: any) {
      return false;
    }
  }
  private async uploadFileCloudinary(file: string, folder: string) {
    const result = await cloudinary.v2.uploader.upload(file, {
      folder
    });
    return { url: result.url, public_id: result.public_id };
  }
}

export const cloudinaryService: CloudinaryService = new CloudinaryService();
