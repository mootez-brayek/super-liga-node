import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { AppError } from './app-error';

const uploadsRoot = path.resolve(process.cwd(), 'uploads');
const uploadFolders = {
  teams: path.join(uploadsRoot, 'teams'),
  players: path.join(uploadsRoot, 'players')
} as const;

type UploadFolder = keyof typeof uploadFolders;

const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'image/bmp': '.bmp',
  'image/avif': '.avif'
};

function ensureDirectory(directory: string) {
  fs.mkdirSync(directory, { recursive: true });
}

for (const directory of Object.values(uploadFolders)) {
  ensureDirectory(directory);
}

function sanitizeBaseName(filename: string) {
  const baseName = path.basename(filename, path.extname(filename));
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return sanitized || 'upload';
}

function resolveLocalUploadPath(publicPath: string) {
  const trimmed = publicPath.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return resolveLocalUploadPath(new URL(trimmed).pathname);
    } catch {
      return null;
    }
  }

  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (!normalized.startsWith('/uploads/')) {
    return null;
  }

  return path.join(process.cwd(), normalized.replace(/^\/+/, ''));
}

export function buildPublicUploadPath(folder: UploadFolder, filename: string) {
  return `/uploads/${folder}/${filename}`;
}

export function createImageUpload(folder: UploadFolder, fieldName: string) {
  return multer({
    storage: multer.diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, uploadFolders[folder]);
      },
      filename: (_req, file, callback) => {
        const extension = imageExtensions[file.mimetype] ?? (path.extname(file.originalname).toLowerCase() || '.bin');
        const sanitizedBaseName = sanitizeBaseName(file.originalname);
        callback(null, `${sanitizedBaseName}-${Date.now()}-${randomUUID()}${extension}`);
      }
    }),
    fileFilter: (_req, file, callback) => {
      if (!file.mimetype.startsWith('image/')) {
        callback(new AppError(400, 'Only image files are allowed'));
        return;
      }

      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  }).single(fieldName);
}

export function deleteUploadedMedia(publicPath: string | null | undefined) {
  if (!publicPath) {
    return;
  }

  const localPath = resolveLocalUploadPath(publicPath);
  if (!localPath || !fs.existsSync(localPath)) {
    return;
  }

  fs.unlinkSync(localPath);
}

export { uploadsRoot };
