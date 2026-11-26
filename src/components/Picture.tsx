import React, { useEffect, useState } from 'react';
import { ASSETS } from '../data/assets';

interface PictureProps {
  assetId: string;
  portraitAssetId?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  preferOriginal?: boolean;
  aspectClassName?: string;
}

export function Picture({
  assetId,
  portraitAssetId,
  alt,
  className = '',
  imgClassName = 'h-full w-full object-cover',
  priority = false,
  preferOriginal = false,
  aspectClassName,
}: PictureProps) {
  const asset = ASSETS[assetId];
  const portraitAsset = portraitAssetId ? ASSETS[portraitAssetId] : undefined;

  const [sourceStage, setSourceStage] = useState<'primary' | 'original' | 'remote' | 'failed'>('primary');

  useEffect(() => {
    setSourceStage('primary');
  }, [assetId, portraitAssetId, preferOriginal]);

  if (!asset) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1F2B38] text-[#FAF8F3]/80 p-6 text-center ${aspectClassName ?? ''} ${className}`}
      >
        <p className="font-serif text-lg">{alt || 'Andaaz Restaurant, Fort Road, Lahore'}</p>
      </div>
    );
  }

  const resolvedAlt = alt ?? asset.alt;

  const primarySrc = preferOriginal
    ? asset.localPath
    : asset.webPath || asset.localPath;

  const currentSrc =
    sourceStage === 'primary'
      ? primarySrc
      : sourceStage === 'original'
        ? asset.localPath
        : asset.fallbackUrl;

  const portraitSrc = portraitAsset
    ? preferOriginal
      ? portraitAsset.localPath
      : portraitAsset.webPath || portraitAsset.localPath
    : undefined;

  const handleError = () => {
    if (sourceStage === 'primary' && primarySrc !== asset.localPath) {
      setSourceStage('original');
    } else if (sourceStage === 'primary' || sourceStage === 'original') {
      setSourceStage('remote');
    } else {
      setSourceStage('failed');
    }
  };

  if (sourceStage === 'failed') {
    return (
      <div
        role="img"
        aria-label={resolvedAlt}
        className={`flex flex-col items-center justify-center bg-[#172332] text-[#FAF8F3] p-8 text-center border border-[#AA7C7E]/25 ${aspectClassName ?? ''} ${className}`}
      >
        <span className="font-serif text-xl tracking-wide">Andaaz Restaurant</span>
        <span className="mt-2 text-xs text-[#FAF8F3]/75 max-w-xs">{resolvedAlt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#172332]/10 ${aspectClassName ?? ''} ${className}`}>
      <picture className="block h-full w-full">
        {portraitSrc && sourceStage === 'primary' && (
          <source media="(max-width: 767px)" srcSet={portraitSrc} />
        )}
        <img
          src={currentSrc}
          alt={resolvedAlt}
          width={asset.width}
          height={asset.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          referrerPolicy="no-referrer"
          onError={handleError}
          className={imgClassName}
        />
      </picture>
    </div>
  );
}
