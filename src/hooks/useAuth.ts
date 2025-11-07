import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  sellerStatus?: string;
  profilePicture?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // Check for OAuth callback token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');

    if (oauthToken) {
      // Clear the URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Set the token and fetch user data
      setToken(oauthToken);
      localStorage.setItem('token', oauthToken);

      // Fetch user profile to get user data
      api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      }).then(response => {
        const userData = response.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        queryClient.invalidateQueries();
      }).catch(() => {
        // If profile fetch fails, clear token
        setToken(null);
        localStorage.removeItem('token');
      });
    }
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      const { token: newToken, ...userData } = data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      const { token: newToken, ...userData } = data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      queryClient.invalidateQueries();
    },
  });

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    queryClient.clear();
  };

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await api.get('/auth/profile');
      return response.data;
    },
    enabled: !!token,
  });

  return {
    user: user || userProfile,
    token,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    setUser,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  };
};