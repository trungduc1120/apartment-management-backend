// src/upload/upload.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { supabase } from '../../supabase/supabase.client';
import * as path from 'path';

@Injectable()
export class UploadService {
  private bucket = process.env.SUPABASE_BUCKET!;

  private getFolder() {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      const ext = path.extname(file.originalname) || '';
      const folder = this.getFolder();
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const filePath = `${folder}/${filename}`;

      const { error: uploadErr } = await supabase.storage
        .from(this.bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // khong ghi de
        });

      if (uploadErr) throw uploadErr;

      // create signed url (7 days) — backend returns url to resident
      const { data: signedData, error: signedErr } = await supabase.storage
        .from(this.bucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 7);

      if (signedErr) throw signedErr;

      return {
        url: signedData.signedUrl,
        path: filePath,
      };
    } catch (e) {
      throw new InternalServerErrorException('Upload failed: ' + (e.message || e));
    }
  }

  async deleteImage(pathToFile: string) {
    try {
      const { error } = await supabase.storage.from(this.bucket).remove([pathToFile]);
      if (error) throw error;
    } catch (e) {
      throw new InternalServerErrorException('Delete failed: ' + (e.message || e));
    }
  }
}
