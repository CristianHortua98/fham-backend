import {
  Controller,
  Get,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { Response } from 'express';
import { diskStorage } from 'multer';
import { FilesService } from './files.service';

import { fileFilter, fileNamer } from './helpers';

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid'
import { Auth } from 'src/auth/decorators';

@ApiTags('Files - Get and Upload')
@Controller('files')
export class FilesController {

  constructor(
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
  ) {

    cloudinary.config({ 
      cloud_name: this.configService.get('CLOUD_NAME'),
      api_key: this.configService.get('API_KEY_CLOUD'), 
      api_secret: this.configService.get('API_SECRET_CLOUD')
    });
    

  }

  @Get('product/:imageName')
  findProductImage(
    @Res() res: Response,
    @Param('imageName') imageName: string,
  ) {

    let formattImage = imageName.split('.')[1];
    
    const path = cloudinary.url(imageName, {
      secure: true,
      format: formattImage,
    });

    return res.redirect(path);

  }

  async uploadToCloudinary(
    buffer: Buffer,
    filename: string,
    formattImage: string
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          // folder: 'products',
          public_id: filename,
          use_filename: true,
          format: formattImage
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
  
      Readable.from(buffer).pipe(stream);
    });
  }

  @Post('product')
  @UseInterceptors(
    FileInterceptor('file'),
  )
  @Auth()
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {

    if (!file) {
      throw new BadRequestException('Make sure that the file is an image');
    }


    let fileNameImage = `${uuid()}.${file.originalname.split('.')[1]}`;
    let formattImage = file.originalname.split('.')[1];
    // console.log(fileNameImage);

    const result = await this.uploadToCloudinary(file.buffer, fileNameImage, formattImage);

    return {
      secureUrl: result.secure_url,
      fileName: result.public_id,
    };

  }
}
