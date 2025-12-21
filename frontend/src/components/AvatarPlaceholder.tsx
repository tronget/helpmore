import { User } from 'lucide-react';

interface AvatarPlaceholderProps {
  className?: string;
  iconClassName?: string;
}

export function AvatarPlaceholder({ className = '', iconClassName = '' }: AvatarPlaceholderProps) {
  return (
    <div className={`rounded-full bg-gray-200 flex items-center justify-center ${className}`}>
      <User className={`text-gray-400 ${iconClassName}`} />
    </div>
  );
}
