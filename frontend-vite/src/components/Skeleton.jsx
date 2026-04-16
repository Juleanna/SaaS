import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`bg-gray-200/70 rounded animate-pulse ${className}`} />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
      />
    ))}
  </div>
);

export const SkeletonTableRow = ({ cols = 4 }) => (
  <tr className="border-b border-gray-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <Skeleton className="h-4 w-3/4" />
      </td>
    ))}
  </tr>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-200/80 p-5 ${className}`}>
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  </div>
);

export default Skeleton;
