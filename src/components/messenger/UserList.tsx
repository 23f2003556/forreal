import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface User {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  lastSeen?: Date;
}

interface UserListProps {
  users: User[];
  selectedUserId?: string;
  onSelectUser: (userId: string) => void;
}

export function UserList({ users, selectedUserId, onSelectUser }: UserListProps) {
  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
    }
  };

  return (
    <div className="w-64 bg-background border-r border-border">
      <div className="overflow-y-auto">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={cn(
              "w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border/50",
              selectedUserId === user.id && "bg-muted"
            )}
          >
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate text-sm">
                {user.name}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}