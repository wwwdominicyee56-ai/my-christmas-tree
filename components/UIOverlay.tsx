import React, { useRef, useState } from 'react';
import { TreeMode } from '../types';

interface UIOverlayProps {
  mode: TreeMode;
  onToggle: () => void;
  onPhotosUpload: (photos: string[]) => void;
  hasPhotos: boolean;
  uploadedPhotos: string[];
  isSharedView: boolean;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ mode, onToggle, onPhotosUpload, hasPhotos, uploadedPhotos, isSharedView }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [shareError, setShareError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // CONFIGURATION: Replace these with your Cloudinary details
  const CLOUD_NAME = "your_cloud_name"; 
  const UPLOAD_PRESET = "your_unsigned_preset"; 

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readers: Promise<string>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const promise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
      readers.push(promise);
    }

    Promise.all(readers).then((urls) => {
      onPhotosUpload(urls);
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleShare = async () => {
    if (!uploadedPhotos || uploadedPhotos.length === 0) {
      setShareError('请先上传照片');
      return;
    }

    setIsSharing(true);
    setShareError('');
    setShareLink('');
    setUploadProgress('准备上传...');

    try {
      setUploadProgress(`上传照片中 (0/${uploadedPhotos.length})...`);
      
      let uploadedCount = 0;
      const uploadPromises = uploadedPhotos.map(async (photo, index) => {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error(`第 ${index + 1} 张图片上传失败`);
        }

        const data = await response.json();
        uploadedCount++;
        setUploadProgress(`上传照片中 (${uploadedCount}/${uploadedPhotos.length})...`);
        
        return data.secure_url;
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Generate a share link by encoding the image URLs into the URL itself
      setUploadProgress('生成分享链接...');
      const encodedData = btoa(JSON.stringify(imageUrls));
      const finalShareLink = `${window.location.origin}/?data=${encodedData}`;
      
      setShareLink(finalShareLink);

    } catch (error: any) {
      console.error('Share error:', error);
      setShareError(error.message || '分享失败，请重试');
    } finally {
      setIsSharing(false);
      setUploadProgress('');
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleCreateMine = () => {
    window.location.href = window.location.origin;
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <header className="absolute top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F5E6BF] to-[#D4AF37] font-serif drop-shadow-lg tracking-wider text-center">
          Merry Christmas
        </h1>
      </header>

      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-4 pointer-events-auto">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {isSharedView && (
          <button
            onClick={handleCreateMine}
            className="group px-6 py-3 border-2 border-[#D4AF37] bg-black/70 backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_30px_#D4AF37] hover:border-[#fff] hover:bg-[#D4AF37]/20"
          >
            <span className="relative z-10 font-serif text-base md:text-lg text-[#D4AF37] tracking-[0.1em] group-hover:text-white transition-colors whitespace-nowrap">
              制作我的圣诞树
            </span>
          </button>
        )}

        {!isSharedView && (
          <>
            {!hasPhotos && (
              <button
                onClick={handleUploadClick}
                className="group px-6 py-3 border-2 border-[#D4AF37] bg-black/70 backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_30px_#D4AF37] hover:border-[#fff] hover:bg-[#D4AF37]/20"
              >
                <span className="relative z-10 font-serif text-base md:text-lg text-[#D4AF37] tracking-[0.1em] group-hover:text-white transition-colors whitespace-nowrap">
                  上传照片
                </span>
              </button>
            )}

            {hasPhotos && !shareLink && (
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="group px-6 py-3 border-2 border-[#D4AF37] bg-black/70 backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_30px_#D4AF37] hover:border-[#fff] hover:bg-[#D4AF37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 font-serif text-base md:text-lg text-[#D4AF37] tracking-[0.1em] group-hover:text-white transition-colors whitespace-nowrap">
                    {uploadProgress || (isSharing ? '生成中...' : '生成分享链接')}
                  </span>
                </button>
                {shareError && (
                  <p className="text-red-400 text-xs font-serif text-right">{shareError}</p>
                )}
              </div>
            )}

            {shareLink && (
              <div className="bg-black/80 backdrop-blur-md border-2 border-[#D4AF37] p-4 max-w-sm">
                <p className="text-[#F5E6BF] font-serif text-sm mb-2">分享链接已生成</p>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-black/50 text-[#D4AF37] px-3 py-2 text-xs border border-[#D4AF37]/30 font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 border border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-colors shrink-0"
                  >
                    <span className="text-[#D4AF37] text-xs font-serif whitespace-nowrap">
                      {copied ? '✓ 已复制' : '复制'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
