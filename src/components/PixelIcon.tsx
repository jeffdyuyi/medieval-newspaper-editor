import React from 'react';
import iconCatalog from '../assets/icon-catalog.json';

interface IconData {
  viewBox?: string;
  body: string;
}

interface PixelIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number | string;
  className?: string;
}

const catalog = iconCatalog as unknown as Record<string, IconData>;

/**
 * PixelIcon: 渲染来自 Pixelarticons 与 Game-icons 的单色矢量图标
 * 默认支持 currentColor
 */
export const PixelIcon: React.FC<PixelIconProps> = ({
  name,
  size = 20,
  className = '',
  style,
  ...props
}) => {
  // 匹配 catalog: 支持 "pixel/save"、"game/book" 或直接 "save"
  let key = name;
  if (!key.includes('/')) {
    if (`pixel/${key}` in catalog) {
      key = `pixel/${key}`;
    } else if (`game/${key}` in catalog) {
      key = `game/${key}`;
    }
  }

  const icon = catalog[key];

  if (!icon) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          ...style,
        }}
        className={className}
        {...props}
      />
    );
  }

  const viewBox = icon.viewBox || '0 0 24 24';

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        lineHeight: 1,
        ...style,
      }}
      {...props}
    >
      <svg
        viewBox={viewBox}
        width={size}
        height={size}
        fill="currentColor"
        style={{ width: '100%', height: '100%', display: 'block' }}
        dangerouslySetInnerHTML={{ __html: icon.body }}
      />
    </span>
  );
};

export default PixelIcon;
