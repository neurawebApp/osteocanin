import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  HeartIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BellIcon,
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  RefreshCcwIcon
} from '@heroicons/react/24/outline';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  description?: string;
  createdAt: string;
}

interface Reminder {
  id: string;
  message: string;
  type: string;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  appointmentId?: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  notes?: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  animal: {
    id: string;
    name: string;
    breed: string;
    age: number;
    weight?: number;
    gender: string;
    notes?: string;
  };
  service: {
    id: string;
    title: string;
    description: string;
    duration: number;
    price: number;
  };
}

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  published: boolean;
  createdAt: string;
  author?: {
    firstName: string;
    lastName: string;
  };
}

interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
  animals: Array<{
    id: string;
    name: string;
    breed: string;
  }>;
  appointments: Array<{
    id: string;
    startTime: string;
    status: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [newTodo, setNewTodo] = useState({ task: '', priority: 'medium' as const, dueDate: '', description: '' });
  const [newReminder, setNewReminder] = useState({
    message: '',
    type: 'APPOINTMENT_REMINDER',
    priority: 'medium',
    dueDate: ''
  });
  const [newBlogPost, setNewBlogPost] = useState({
    title: '', titleFr: '', excerpt: '', excerptFr: '', content: '', contentFr: '', 
    coverImage: '', published: false, seoTitle: '', seoTitleFr: '', seoDesc: '', seoDescFr: ''
  });
  const [showNewTodoForm, setShowNewTodoForm] = useState(false);
  const [showNewReminderForm, setShowNewReminderForm] = useState(false);
  const [showNewBlogForm, setShowNewBlogForm] = useState(false);
  const [deletingTodo, setDeletingTodo] = useState<string | null>(null);
  const [completingTodo, setCompletingTodo] = useState<string | null>(null);
  const [confirmingAppointment, setConfirmingAppointment] = useState<string | null>(null);
  const [refusingAppointment, setRefusingAppointment] = useState<string | null>(null);
  const [cancellingAppointment, setCancellingAppointment] = useState<string | null>(null);
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [completingReminder, setCompletingReminder] = useState<string | null>(null);
  const [deletingReminder, setDeletingReminder] = useState<string | null>(null);
  const [validatingClient, setValidatingClient] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<string | null>(null);
  const [showCreateReminder, setShowCreateReminder] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Data fetching
  const { data: dashboardMetrics } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PRACTITIONER')
  });

  const { data: todosData, refetch: refetchTodos } = useQuery({
    queryKey: ['todos'],
    queryFn: () => apiClient.getTodos(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PRACTITIONER')
  });

  const { data: remindersData, refetch: refetchReminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => apiClient.getReminders(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PRACTITIONER')
  });

  const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => apiClient.getAppointments(),
    enabled: isAuthenticated
  });

  const { data: pendingAppointmentsData } = useQuery({
    queryKey: ['pending-appointments'],
    queryFn: () => apiClient.getPendingAppointments(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PRACTITIONER')
  });

  const { data: blogPostsData, refetch: refetchBlogPosts } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: () => apiClient.getAdminBlogPosts(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PRACTITIONER')
  });

  const { data: clientsData, refetch: refetchClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.getClients(),
    enabled: isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'PRACTITIONER')
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: () => apiClient.getAnimals(),
    enabled: isAuthenticated
  });

  // Mutations
  const createTodoMutation = useMutation({
    mutationFn: (data: typeof newTodo) => apiClient.createTodo(data),
    onSuccess: () => {
      refetchTodos();
      setNewTodo({ task: '', priority: 'medium', dueDate: '', description: '' });
      setShowNewTodoForm(false);
    }
  });

  const toggleTodoMutation = useMutation({
    mutationFn: (id: string) => apiClient.toggleTodo(id),
    onSuccess: () => refetchTodos()
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTodo(id),
    onSuccess: () => refetchTodos()
  });

  const createReminderMutation = useMutation({
    mutationFn: (data: typeof newReminder) => apiClient.createReminder(data),
    onSuccess: () => {
      refetchReminders();
      setNewReminder({ message: '', type: 'manual', dueDate: '', priority: 'medium' });
      setShowNewReminderForm(false);
    }
  });

  const markReminderDoneMutation = useMutation({
    mutationFn: (id: string) => apiClient.markReminderDone(id),
    onSuccess: () => refetchReminders()
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteReminder(id),
    onSuccess: () => refetchReminders()
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: (id: string) => apiClient.confirmAppointment(id),
    onSuccess: () => {
      refetchAppointments();
      queryClient.invalidateQueries({ queryKey: ['pending-appointments'] });
    }
  });

  const refuseAppointmentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => apiClient.refuseAppointment(id, reason),
    onSuccess: () => {
      refetchAppointments();
      queryClient.invalidateQueries({ queryKey: ['pending-appointments'] });
    }
  });

  const createBlogPostMutation = useMutation({
    mutationFn: (data: typeof newBlogPost) => apiClient.createBlogPost(data),
    onSuccess: () => {
      refetchBlogPosts();
      setNewBlogPost({
        title: '', titleFr: '', excerpt: '', excerptFr: '', content: '', contentFr: '', 
        coverImage: '', published: false, seoTitle: '', seoTitleFr: '', seoDesc: '', seoDescFr: ''
      });
      setShowNewBlogForm(false);
    }
  });

  const deleteBlogPostMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteBlogPost(id),
    onSuccess: () => refetchBlogPosts()
  });

  const validateClientMutation = useMutation({
    mutationFn: (id: string) => apiClient.validateClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteClient(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] })
  });

  const handleConfirmAppointment = async (appointmentId: string) => {
    setConfirmingAppointment(appointmentId);
    try {
      await apiClient.confirmAppointment(appointmentId);
      refetchAppointments();
      refetchPendingAppointments();
      refetchMetrics();
    } catch (error) {
      console.error('Error confirming appointment:', error);
    } finally {
      setConfirmingAppointment(null);
    }
  };

  const handleRefuseAppointment = async (appointmentId: string) => {
    setRefusingAppointment(appointmentId);
    try {
      await apiClient.refuseAppointment(appointmentId, 'Refused by admin');
      refetchAppointments();
      refetchPendingAppointments();
      refetchMetrics();
    } catch (error) {
      console.error('Error refusing appointment:', error);
    } finally {
      setRefusingAppointment(null);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    setCancellingAppointment(appointmentId);
    try {
      await apiClient.cancelAppointment(appointmentId);
      refetchAppointments();
      refetchPendingAppointments();
      refetchMetrics();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    } finally {
      setCancellingAppointment(null);
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingReminder(true);
    try {
      await apiClient.createReminder({
        message: newReminder.message,
        type: newReminder.type,
        priority: newReminder.priority as 'high' | 'medium' | 'low',
        dueDate: newReminder.dueDate
      });
      refetchReminders();
      setShowCreateReminder(false);
      setNewReminder({
        message: '',
        type: 'APPOINTMENT_REMINDER',
        priority: 'medium',
        dueDate: ''
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setCreatingReminder(false);
    }
  };

  const handleMarkReminderDone = async (reminderId: string) => {
    setCompletingReminder(reminderId);
    try {
      await apiClient.markReminderDone(reminderId);
      refetchReminders();
    } catch (error) {
      console.error('Error marking reminder done:', error);
    } finally {
      setCompletingReminder(null);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    setDeletingReminder(reminderId);
    try {
      await apiClient.deleteReminder(reminderId);
      refetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    } finally {
      setDeletingReminder(null);
    }
  };

  const handleValidateClient = async (clientId: string) => {
    setValidatingClient(clientId);
    try {
      await apiClient.validateClient(clientId);
      refetchClients();
    } catch (error) {
      console.error('Error validating client:', error);
    } finally {
      setValidatingClient(null);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      setDeletingClient(clientId);
      try {
        await apiClient.deleteClient(clientId);
        refetchClients();
        refetchMetrics();
      } catch (error) {
        console.error('Error deleting client:', error);
      } finally {
        setDeletingClient(null);
      }
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if not authenticated (this should be handled by useEffect, but as fallback)
  if (!isAuthenticated || !user) {
    return null;
  }

  const todos = todosData?.data || [];
  const reminders = remindersData?.data || [];
  const appointments = appointmentsData?.data || [];
  const pendingAppointments = pendingAppointmentsData?.data || [];
  const blogPosts = blogPostsData?.data || [];
  const clients = clientsData?.data || [];
  const animals = animalsData?.data || [];
  const metrics = dashboardMetrics?.data || {};

  const isAdmin = user.role === 'ADMIN' || user.role === 'PRACTITIONER';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {isAdmin ? 'Manage your practice and appointments' : 'View your appointments and pets'}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Link to="/booking">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: ChartBarIcon },
                { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
                ...(isAdmin ? [
                  { id: 'pending', label: 'Pending', icon: ClockIcon },
                  { id: 'todos', label: 'Tasks', icon: DocumentTextIcon },
                  { id: 'reminders', label: 'Reminders', icon: BellIcon },
                  { id: 'blog', label: 'Blog', icon: PencilIcon },
                  { id: 'clients', label: 'Clients', icon: UserGroupIcon },
                ] : []),
                { id: 'animals', label: 'My Pets', icon: HeartIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Cards (Admin Only) */}
              {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <UserGroupIcon className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalClients || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CalendarIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalAppointments || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ClockIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.pendingAppointments || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <HeartIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pets</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalAnimals || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Recent Appointments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {appointments.slice(0, 5).map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {appointment.client.firstName} {appointment.client.lastName} - {appointment.animal.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {appointment.service.title} • {new Date(appointment.startTime).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={appointment.status === 'COMPLETED' ? 'default' : 'outline'}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                      {appointments.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments found</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab('appointments')}
                    >
                      View All Appointments
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HeartIcon className="h-5 w-5 mr-2" />
                      {isAdmin ? 'Recent Pets' : 'My Pets'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {animals.slice(0, 5).map((animal: any) => (
                        <div key={animal.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{animal.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {animal.breed} • {animal.age} years old
                            </p>
                          </div>
                          <Badge variant="outline">{animal.gender}</Badge>
                        </div>
                      ))}
                      {animals.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No pets registered yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* All Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Appointments</h2>
                <Button onClick={() => refetchAppointments()}>
                  <RefreshCcwIcon className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {appointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {appointment.client.firstName} {appointment.client.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {appointment.animal.name} ({appointment.animal.breed})
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {appointment.service.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={
                            appointment.status === 'COMPLETED' ? 'default' :
                            appointment.status === 'CONFIRMED' ? 'secondary' :
                            appointment.status === 'CANCELLED' ? 'destructive' : 'outline'
                          }>
                            {appointment.status}
                          </Badge>
                          {user?.role !== 'CLIENT' && appointment.status === 'SCHEDULED' && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                onClick={() => handleConfirmAppointment(appointment.id)}
                                disabled={confirmingAppointment === appointment.id}
                              >
                                {confirmingAppointment === appointment.id ? 'Confirming...' : 'Confirm'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRefuseAppointment(appointment.id)}
                                disabled={refusingAppointment === appointment.id}
                              >
                                {refusingAppointment === appointment.id ? 'Refusing...' : 'Refuse'}
                              </Button>
                            </div>
                          )}
                          {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCancelAppointment(appointment.id)}
                              disabled={cancellingAppointment === appointment.id}
                            >
                              {cancellingAppointment === appointment.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No appointments found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pending Appointments Tab (Admin Only) */}
          {activeTab === 'pending' && isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Pending Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingAppointments.map((appointment: Appointment) => (
                    <div key={appointment.id} className="border dark:border-gray-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {appointment.animal.name} - {appointment.service.title}
                            </h3>
                            <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Pending Approval
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <p>📅 {new Date(appointment.startTime).toLocaleDateString()}</p>
                            <p>🕐 {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p>👤 {appointment.client.firstName} {appointment.client.lastName}</p>
                            <p>📧 {appointment.client.email}</p>
                            <p>📱 {appointment.client.phone}</p>
                            <p>💰 €{appointment.service.price}</p>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm"><strong>Pet:</strong> {appointment.animal.name} ({appointment.animal.breed}, {appointment.animal.age} years)</p>
                            {appointment.notes && (
                              <p className="text-sm mt-1"><strong>Notes:</strong> {appointment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 lg:mt-0 lg:ml-4 flex space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => confirmAppointmentMutation.mutate(appointment.id)}
                            disabled={confirmAppointmentMutation.isPending}
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => refuseAppointmentMutation.mutate({ id: appointment.id })}
                            disabled={refuseAppointmentMutation.isPending}
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Refuse
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pendingAppointments.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No pending appointments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tasks Tab (Admin Only) */}
          {activeTab === 'todos' && isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 mr-2" />
                    Tasks & To-Do
                  </CardTitle>
                  <Button onClick={() => setShowNewTodoForm(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showNewTodoForm && (
                  <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-semibold mb-4">Add New Task</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task">Task *</Label>
                        <Input
                          id="task"
                          value={newTodo.task}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, task: e.target.value }))}
                          placeholder="Enter task description"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={newTodo.priority} onValueChange={(value: any) => setNewTodo(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="dueDate">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={newTodo.dueDate}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={newTodo.description}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Additional details..."
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        onClick={() => createTodoMutation.mutate(newTodo)}
                        disabled={!newTodo.task || createTodoMutation.isPending}
                      >
                        {createTodoMutation.isPending ? 'Creating...' : 'Create Task'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewTodoForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {todos.map((todo: Todo) => (
                    <div key={todo.id} className={`flex items-center space-x-3 p-3 rounded-lg border dark:border-gray-700 ${todo.completed ? 'bg-gray-50 dark:bg-gray-800 opacity-75' : 'bg-white dark:bg-gray-900'}`}>
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodoMutation.mutate(todo.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {todo.task}
                        </p>
                        {todo.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{todo.description}</p>
                        )}
                        {todo.dueDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Due: {new Date(todo.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className={getPriorityColor(todo.priority)}>
                        {todo.priority}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTodoMutation.mutate(todo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {todos.length === 0 && (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reminders</h2>
                <Button onClick={() => setShowCreateReminder(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Reminder
                </Button>
              </div>

              {/* Create Reminder Form */}
              {showCreateReminder && (
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Reminder</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateReminder} className="space-y-4">
                      <div>
                        <Label htmlFor="reminderMessage">Message</Label>
                        <Input
                          id="reminderMessage"
                          value={newReminder.message}
                          onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Enter reminder message"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="reminderType">Type</Label>
                          <Select value={newReminder.type} onValueChange={(value) => setNewReminder(prev => ({ ...prev, type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="APPOINTMENT_REMINDER">Appointment Reminder</SelectItem>
                              <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                              <SelectItem value="APPOINTMENT_CONFIRMATION">Confirmation</SelectItem>
                              <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="reminderPriority">Priority</Label>
                          <Select value={newReminder.priority} onValueChange={(value) => setNewReminder(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="reminderDueDate">Due Date</Label>
                        <Input
                          id="reminderDueDate"
                          type="datetime-local"
                          value={newReminder.dueDate}
                          onChange={(e) => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button type="submit" disabled={creatingReminder}>
                          {creatingReminder ? 'Creating...' : 'Create Reminder'}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowCreateReminder(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {reminders.map((reminder: any) => (
                      <div key={reminder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{reminder.message}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Due: {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={reminder.priority === 'high' ? 'destructive' : reminder.priority === 'medium' ? 'default' : 'secondary'}>
                            {reminder.priority}
                          </Badge>
                          {!reminder.completed && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleMarkReminderDone(reminder.id)}
                              disabled={completingReminder === reminder.id}
                            >
                              {completingReminder === reminder.id ? 'Marking...' : 'Mark Done'}
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteReminder(reminder.id)}
                            disabled={deletingReminder === reminder.id}
                          >
                            {deletingReminder === reminder.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {reminders.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">No reminders found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blog Tab (Admin Only) */}
          {activeTab === 'blog' && isAdmin && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Blog Management
                  </CardTitle>
                  <Button onClick={() => setShowNewBlogForm(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    New Article
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showNewBlogForm && (
                  <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h3 className="font-semibold mb-4">Create New Blog Post</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Title (English) *</Label>
                          <Input
                            id="title"
                            value={newBlogPost.title}
                            onChange={(e) => setNewBlogPost(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter post title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="titleFr">Title (French) *</Label>
                          <Input
                            id="titleFr"
                            value={newBlogPost.titleFr}
                            onChange={(e) => setNewBlogPost(prev => ({ ...prev, titleFr: e.target.value }))}
                            placeholder="Entrez le titre"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="excerpt">Excerpt (English)</Label>
                          <Textarea
                            id="excerpt"
                            value={newBlogPost.excerpt}
                            onChange={(e) => setNewBlogPost(prev => ({ ...prev, excerpt: e.target.value }))}
                            placeholder="Brief description..."
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="excerptFr">Excerpt (French)</Label>
                          <Textarea
                            id="excerptFr"
                            value={newBlogPost.excerptFr}
                            onChange={(e) => setNewBlogPost(prev => ({ ...prev, excerptFr: e.target.value }))}
                            placeholder="Brève description..."
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="content">Content (English) *</Label>
                          <Textarea
                            id="content"
                            value={newBlogPost.content}
                            onChange={(e) => setNewBlogPost(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Write your article content..."
                            rows={6}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contentFr">Content (French) *</Label>
                          <Textarea
                            id="contentFr"
                            value={newBlogPost.contentFr}
                            onChange={(e) => setNewBlogPost(prev => ({ ...prev, contentFr: e.target.value }))}
                            placeholder="Rédigez le contenu de votre article..."
                            rows={6}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="coverImage">Cover Image URL</Label>
                        <Input
                          id="coverImage"
                          value={newBlogPost.coverImage}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, coverImage: e.target.value }))}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="published"
                          checked={newBlogPost.published}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, published: e.target.checked }))}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <Label htmlFor="published">Publish immediately</Label>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button 
                        onClick={() => createBlogPostMutation.mutate(newBlogPost)}
                        disabled={!newBlogPost.title || !newBlogPost.content || createBlogPostMutation.isPending}
                      >
                        {createBlogPostMutation.isPending ? 'Creating...' : 'Create Post'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewBlogForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {blogPosts.map((post: BlogPost) => (
                    <div key={post.id} className="border dark:border-gray-700 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                            <Badge className={post.published ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}>
                              {post.published ? 'Published' : 'Draft'}
                            </Badge>
                          </div>
                          {post.excerpt && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{post.excerpt}</p>
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Created: {new Date(post.createdAt).toLocaleDateString()}
                            {post.author && ` by ${post.author.firstName} ${post.author.lastName}`}
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-2">
                          <Link to={`/blog/${post.slug}`}>
                            <Button variant="outline" size="sm">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBlogPostMutation.mutate(post.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {blogPosts.length === 0 && (
                    <div className="text-center py-8">
                      <PencilIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No blog posts yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clients Tab (Admin Only) */}
          {activeTab === 'clients' && isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Client Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {client.firstName} {client.lastName}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{client.email}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{client.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {client.animals?.length || 0} pets • {client.appointments?.length || 0} appointments
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Joined: {new Date(client.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleValidateClient(client.id)}
                          disabled={validatingClient === client.id}
                        >
                          {validatingClient === client.id ? 'Validating...' : 'Validate'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteClient(client.id)}
                          disabled={deletingClient === client.id}
                        >
                          {deletingClient === client.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No clients found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Animals Tab */}
          {activeTab === 'animals' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <HeartIcon className="h-5 w-5 mr-2" />
                    {isAdmin ? 'All Pets' : 'My Pets'}
                  </CardTitle>
                  {!isAdmin && (
                    <Button>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Pet
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {animals.map((animal: any) => (
                    <div key={animal.id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{animal.name}</h3>
                        <Badge variant="outline">{animal.gender}</Badge>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Breed:</strong> {animal.breed}</p>
                        <p><strong>Age:</strong> {animal.age} years old</p>
                        {animal.weight && <p><strong>Weight:</strong> {animal.weight} kg</p>}
                        {isAdmin && animal.owner && (
                          <p><strong>Owner:</strong> {animal.owner.firstName} {animal.owner.lastName}</p>
                        )}
                      </div>
                      {animal.notes && (
                        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                          <p><strong>Notes:</strong> {animal.notes}</p>
                        </div>
                      )}
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {!isAdmin && (
                          <Button variant="outline" size="sm">
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {animals.length === 0 && (
                    <div className="col-span-full text-center py-8">
                      <HeartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No pets registered yet</p>
                      {!isAdmin && (
                        <Button className="mt-4">
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Your First Pet
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;