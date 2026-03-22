import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store';

// Login hook
export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser, setAuthenticated } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await authApi.login(email, password);
      return response.data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      setAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// Register hook
export function useRegister() {
  const queryClient = useQueryClient();
  const { setUser, setAuthenticated } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({ email, password, username }: { email: string; password: string; username: string }) => {
      const response = await authApi.register(email, password, username);
      return response.data.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      setAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

// Logout hook
export function useLogout() {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  
  return useMutation({
    mutationFn: async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    },
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      logout();
      queryClient.clear();
    },
  });
}

// Current user hook
export function useCurrentUser() {
  const { setUser, setAuthenticated } = useAuthStore();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      try {
        const response = await authApi.getMe();
        setUser(response.data.data);
        setAuthenticated(true);
        return response.data.data;
      } catch (error) {
        // Token invalid or expired — clear it silently
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setAuthenticated(false);
        return null;
      }
    },
    enabled: hasToken, // Don't even try if no token exists
    staleTime: 300000,
    retry: false,
  });
}
