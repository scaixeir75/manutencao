import type { PhotosToolResult } from '../types/aiTypes';

export async function consultPhotos(
  photos: string[] = [],
): Promise<PhotosToolResult> {
  return {
    photos: [...photos],
    source: 'simulated',
  };
}

