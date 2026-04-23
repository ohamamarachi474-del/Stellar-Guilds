// ProfileSkeleton.tsx — skeleton loaders for Avatar, Bio, Reputation Chart
import { CSSProperties } from "react";

const Shimmer = ({
  className,
  style,
}: {
  className: string;
  style?: CSSProperties;
}) => (
  <div
    className={`animate-pulse bg-slate-700/50 rounded ${className}`}
    style={style}
  />
);

export const AvatarSkeleton = () => (
  <div className="flex items-center gap-4">
    <Shimmer className="w-20 h-20 rounded-full" />
    <div className="space-y-2">
      <Shimmer className="w-36 h-5" />
      <Shimmer className="w-24 h-4" />
    </div>
  </div>
);

export const BioSkeleton = () => (
  <div className="space-y-2 mt-4">
    <Shimmer className="w-full h-4" />
    <Shimmer className="w-5/6 h-4" />
    <Shimmer className="w-3/4 h-4" />
  </div>
);

export const ReputationChartSkeleton = () => (
  <div className="mt-6 space-y-3">
    <Shimmer className="w-40 h-5" /> {/* chart title */}
    <div className="flex items-end gap-2 h-32">
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <Shimmer key={i} className="flex-1" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

// ─── Composed profile skeleton ────────────────────────────────────────────────
export const ProfilePageSkeleton = () => (
  <div className="p-6 max-w-2xl">
    <AvatarSkeleton />
    <BioSkeleton />
    <ReputationChartSkeleton />
  </div>
);

// ─── Usage: toggle via `isLoading` prop ──────────────────────────────────────
interface ProfilePageProps {
  isLoading?: boolean;
  user?: { name: string; handle: string; bio: string };
}

export const ProfilePage = ({ isLoading = false, user }: ProfilePageProps) => {
  if (isLoading) return <ProfilePageSkeleton />;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <img
          src="/avatar.png"
          className="w-20 h-20 rounded-full"
          alt="avatar"
        />
        <div>
          <p className="text-lg font-semibold text-white">{user?.name}</p>
          <p className="text-slate-400 text-sm">{user?.handle}</p>
        </div>
      </div>
      <p className="mt-4 text-slate-300">{user?.bio}</p>
      {/* real reputation chart goes here */}
    </div>
  );
};
