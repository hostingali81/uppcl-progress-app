// src/lib/media/capture.ts
import imageCompression from 'browser-image-compression';

export interface CaptureOptions {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker: boolean;
}

const defaultOptions: CaptureOptions = {
    maxSizeMB: 1, // Compress 5MB to ~1MB
    maxWidthOrHeight: 1920,
    useWebWorker: true
};

/**
 * Capture an image from camera or file picker with automatic compression
 */
export async function captureImage(options: Partial<CaptureOptions> = {}): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'environment'); // Use rear camera on mobile

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }

            try {
                const compressed = await imageCompression(file, { ...defaultOptions, ...options });
                resolve(compressed);
            } catch (error) {
                reject(error);
            }
        };

        input.onerror = () => {
            reject(new Error('File selection cancelled'));
        };

        input.click();
    });
}

/**
 * Select any file from device
 */
export async function selectFile(): Promise<File> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '*/*';

        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            resolve(file);
        };

        input.onerror = () => {
            reject(new Error('File selection cancelled'));
        };

        input.click();
    });
}

/**
 * Select multiple images with compression
 */
export async function selectMultipleImages(options: Partial<CaptureOptions> = {}): Promise<Blob[]> {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;

        input.onchange = async (e) => {
            const files = Array.from((e.target as HTMLInputElement).files || []);
            if (files.length === 0) {
                reject(new Error('No files selected'));
                return;
            }

            try {
                const compressed = await Promise.all(
                    files.map(file => imageCompression(file, { ...defaultOptions, ...options }))
                );
                resolve(compressed);
            } catch (error) {
                reject(error);
            }
        };

        input.onerror = () => {
            reject(new Error('File selection cancelled'));
        };

        input.click();
    });
}

/**
 * Create a blob URL for preview
 */
export function createBlobUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
}

/**
 * Revoke a blob URL to free memory
 */
export function revokeBlobUrl(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

/**
 * Convert blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Convert base64 string to blob
 */
export async function base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return await response.blob();
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
