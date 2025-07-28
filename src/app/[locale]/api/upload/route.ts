import type { NextRequest } from 'next/server';
import { Buffer } from 'node:buffer';
import { NextResponse } from 'next/server';
import { uploadImage } from '@/libs/DigitalOceanSpaces';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 files allowed' }, { status: 400 });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to DigitalOcean Spaces
      const url = await uploadImage(buffer);
      uploadedUrls.push(url);
    }

    return NextResponse.json({ urls: uploadedUrls });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
