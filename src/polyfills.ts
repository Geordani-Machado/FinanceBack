import { File, Blob } from 'node:buffer';

if (typeof global.File === 'undefined' && typeof File !== 'undefined') {
    (global as any).File = File;
}

if (typeof global.Blob === 'undefined' && typeof Blob !== 'undefined') {
    (global as any).Blob = Blob;
}
