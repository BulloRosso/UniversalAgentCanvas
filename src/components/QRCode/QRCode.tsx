import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  encodeText: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  fgColor?: string;
  bgColor?: string;
}

const QRCode: React.FC<QRCodeProps> = ({
  encodeText,
  size = 128,
  level = 'L',
  includeMargin = true,
  fgColor = '#000000',
  bgColor = '#ffffff'
}) => {
  return (
    <div className="inline-block p-4 bg-white rounded-lg shadow-md">
      <QRCodeSVG
        value={encodeText}
        size={size}
        level={level}
        includeMargin={includeMargin}
        fgColor={fgColor}
        bgColor={bgColor}
      />
    </div>
  );
};

export default QRCode;