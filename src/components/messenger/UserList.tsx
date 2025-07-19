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
    <div className="w-80 bg-chat-panel border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Contacts</h2>
      </div>
      
      <div className="overflow-y-auto">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user.id)}
            className={cn(
              "w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left",
              selectedUserId === user.id && "bg-secondary"
            )}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-chat-panel",
                getStatusColor(user.status)
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {user.name}
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                {user.status}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}