// web版：替换 expo-image-picker → File System Access API
import { BaseService, service } from '$/core';
import { FileEnums } from '$/enums';
import type { FileTypes } from '$/types';
import { PermissionService } from './permission';

@service()
export class MediaService extends BaseService {
    public constructor(_permissionService: PermissionService) {
        super();
    }

    public readonly pickImage = async (): Promise<FileTypes.ImageInfo | null> => {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = () => {
                const file = input.files?.[0];
                if (!file) { resolve(null); return; }
                const uri = URL.createObjectURL(file);
                const img = new window.Image();
                img.onload = () => {
                    resolve({
                        kind: FileEnums.Media.Image,
                        uri,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                    });
                };
                img.onerror = () => resolve(null);
                img.src = uri;
            };
            input.click();
        });
    };

    public readonly launchMediaLibrary = async () => this.pickImage();
}
