import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user } = useAuth();
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    const setOnlineStatus = async (isOnline: boolean) => {
      try {
        console.log('Updating user presence:', { userId: user.id, isOnline });
        const { error } = await supabase.rpc('update_user_presence', {
          user_uuid: user.id,
          online_status: isOnline
        });
        if (error) throw error;
        console.log('Presence updated successfully');
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Set user as online when they connect
    setOnlineStatus(true);
    
    // Periodic heartbeat to maintain online status
    const heartbeatInterval = setInterval(() => {
      setOnlineStatus(true);
    }, 60000); // Every minute

    // Set up presence channel
    presenceChannelRef.current = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        // Sync event
      })
      .on('presence', { event: 'join' }, () => {
        // User joined
      })
      .on('presence', { event: 'leave' }, () => {
        // User left
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await presenceChannelRef.current?.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Set user as offline when they disconnect
    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(true);
      } else {
        setOnlineStatus(false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      setOnlineStatus(false);
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [user]);

  const getOnlineUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('is_online', true)
        .neq('user_id', user?.id || '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching online users:', error);
      return [];
    }
  };

  return {
    getOnlineUsers,
  };
}