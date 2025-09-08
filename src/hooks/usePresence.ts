import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePresence() {
  const { user } = useAuth();
  const presenceChannelRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const currentStatusRef = useRef<boolean | null>(null);

  const setOnlineStatus = useCallback(async (isOnline: boolean) => {
    if (!user || isUpdatingRef.current || currentStatusRef.current === isOnline) {
      return; // Prevent overlapping updates and redundant calls
    }

    isUpdatingRef.current = true;
    try {
      console.log('Updating user presence:', { userId: user.id, isOnline });
      const { error } = await supabase.rpc('update_user_presence', {
        user_uuid: user.id,
        online_status: isOnline
      });
      if (error) throw error;
      currentStatusRef.current = isOnline;
      console.log('Presence updated successfully');
    } catch (error) {
      console.error('Error updating presence:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Set user as online when they connect
    setOnlineStatus(true);
    
    // Periodic heartbeat to maintain online status (every 2 minutes)
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setOnlineStatus(true);
      }
    }, 120000);

    // Set up presence channel
    presenceChannelRef.current = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        console.log('Presence sync');
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
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

    // Debounced visibility change handler
    let visibilityTimeout: NodeJS.Timeout;
    const handleVisibilityChange = () => {
      clearTimeout(visibilityTimeout);
      visibilityTimeout = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setOnlineStatus(true);
        } else {
          // Don't immediately set offline on visibility change
          // Let the heartbeat handle offline status
        }
      }, 1000); // 1 second debounce
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(visibilityTimeout);
      setOnlineStatus(false);
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [user, setOnlineStatus]);

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