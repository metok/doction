interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height, className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-bg-tertiary rounded ${className}`}
      style={{ width, height, ...style }}
    />
  );
}
