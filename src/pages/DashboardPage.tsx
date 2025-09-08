// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { 
  CalendarIcon,
  UserGroupIcon,
  HeartIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  CheckIcon,
  XCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

interface TodoItem {
  id: string;
  task: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
}

interface ReminderItem {
  id: string;
  type: string;
  message: string;
  dueDate: string;
  completed: boolean;
  appointmentId?: string;
  priority: 'high' | 'medium' | 'low';
}

const DashboardPage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null);

  // Fetch user's animals and appointments
  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: () => apiClient.getAnimals(),
    enabled: !!user && user.role === 'CLIENT'
  });

  const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => apiClient.getAppointments(),
    enabled: !!user
  });

  // Fetch clients for admin
  const { data: clientsData, refetch: refetchClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.getClients(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER')
  });

  // Fetch pending appointments for admin
  const { data: pendingAppointmentsData, refetch: refetchPendingAppointments } = useQuery({
    queryKey: ['pending-appointments'],
    queryFn: () => apiClient.getPendingAppointments(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER')
  });

  // Fetch blog posts for admin
  const { data: blogPostsData, refetch: refetchBlogPosts } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: () => apiClient.getAdminBlogPosts(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER')
  });

  // Fetch admin dashboard data
  const { data: metricsData } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER'),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: scheduleData, refetch: refetchSchedule } = useQuery({
    queryKey: ['today-schedule'],
    queryFn: () => apiClient.getTodaySchedule(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER'),
    refetchInterval: 60000 // Refresh every minute
  });

  // Fetch todos and reminders
  const { data: todosData, refetch: refetchTodos } = useQuery({
    queryKey: ['todos'],
    queryFn: () => apiClient.getTodos(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER')
  });

  const { data: remindersData, refetch: refetchReminders } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => apiClient.getReminders(),
    enabled: !!user && (user.role === 'ADMIN' || user.role === 'PRACTITIONER')
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: (appointmentId: string) => apiClient.cancelAppointment(appointmentId),
    onSuccess: () => {
      refetchAppointments();
      refetchSchedule();
      refetchPendingAppointments();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  });

  // Confirm appointment mutation
  const confirmAppointmentMutation = useMutation({
    mutationFn: (appointmentId: string) => apiClient.confirmAppointment(appointmentId),
    onSuccess: () => {
      refetchAppointments();
      refetchSchedule();
      refetchPendingAppointments();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  });

  // Refuse appointment mutation
  const refuseAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, reason }: { appointmentId: string; reason?: string }) => 
      apiClient.refuseAppointment(appointmentId, reason),
    onSuccess: () => {
      refetchAppointments();
      refetchSchedule();
      refetchPendingAppointments();
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  });

  // Delete blog post mutation
  const deleteBlogPostMutation = useMutation({
    mutationFn: (postId: string) => apiClient.deleteBlogPost(postId),
    onSuccess: () => {
      refetchBlogPosts();
    }
  });

  // Validate client mutation
  const validateClientMutation = useMutation({
    mutationFn: (clientId: string) => apiClient.validateClient(clientId),
    onSuccess: () => {
      refetchClients();
    }
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => apiClient.deleteClient(clientId),
    onSuccess: () => {
      refetchClients();
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const animals = animalsData?.data || [];
  const appointments = appointmentsData?.data || [];
  const clients = clientsData?.data || [];
  const pendingAppointments = pendingAppointmentsData?.data || [];
  const blogPosts = blogPostsData?.data || [];
  const metrics = metricsData?.data;
  const todaySchedule = scheduleData?.data || [];
  const todos = todosData?.data || [];
  const reminders = remindersData?.data || [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      await cancelAppointmentMutation.mutateAsync(appointmentId);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    await confirmAppointmentMutation.mutateAsync(appointmentId);
  };

  const handleRefuseAppointment = async (appointmentId: string, reason?: string) => {
    if (window.confirm('Are you sure you want to refuse this appointment?')) {
      await refuseAppointmentMutation.mutateAsync({ appointmentId, reason });
    }
  };

  const handleViewAppointmentDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const handleAddTreatmentNote = (animal: any) => {
    setSelectedAnimal(animal);
    setShowTreatmentModal(true);
  };

  const isAdmin = user.role === 'ADMIN' || user.role === 'PRACTITIONER';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Manage your practice and grow your business' : 'Manage your pets and appointments'}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2">
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        {isAdmin ? (
          <AdminDashboard 
            metrics={metrics} 
            todaySchedule={todaySchedule} 
            todos={todos}
            reminders={reminders}
            clients={clients}
            pendingAppointments={pendingAppointments}
            blogPosts={blogPosts}
            onViewAppointment={handleViewAppointmentDetails}
            onCancelAppointment={handleCancelAppointment}
            onConfirmAppointment={handleConfirmAppointment}
            onRefuseAppointment={handleRefuseAppointment}
            onValidateClient={validateClientMutation.mutate}
            onDeleteClient={deleteClientMutation.mutate}
            onDeleteBlogPost={deleteBlogPostMutation.mutate}
            onShowBlogModal={() => setShowBlogModal(true)}
            refetchTodos={refetchTodos}
            refetchReminders={refetchReminders}
            refetchSchedule={refetchSchedule}
            refetchClients={refetchClients}
            refetchBlogPosts={refetchBlogPosts}
          />
        ) : (
          <ClientDashboard 
            animals={animals} 
            appointments={appointments}
            onViewAppointment={handleViewAppointmentDetails}
            onCancelAppointment={handleCancelAppointment}
            onAddTreatmentNote={handleAddTreatmentNote}
          />
        )}
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <AppointmentModal 
          appointment={selectedAppointment}
          onClose={() => setShowAppointmentModal(false)}
          onCancel={() => handleCancelAppointment(selectedAppointment.id)}
          onConfirm={isAdmin ? () => handleConfirmAppointment(selectedAppointment.id) : undefined}
          onRefuse={isAdmin ? (reason) => handleRefuseAppointment(selectedAppointment.id, reason) : undefined}
        />
      )}

      {/* Blog Post Modal */}
      {showBlogModal && (
        <BlogPostModal 
          onClose={() => setShowBlogModal(false)}
          onSuccess={() => {
            setShowBlogModal(false);
            refetchBlogPosts();
          }}
        />
      )}

      {/* Treatment Note Modal */}
      {showTreatmentModal && selectedAnimal && (
        <TreatmentNoteModal 
          animal={selectedAnimal}
          onClose={() => {
            setShowTreatmentModal(false);
            setSelectedAnimal(null);
          }}
          onSuccess={() => {
            setShowTreatmentModal(false);
            setSelectedAnimal(null);
          }}
        />
      )}
    </div>
  );
};

function AdminDashboard({ 
  metrics, 
  todaySchedule, 
  todos, 
  reminders, 
  clients,
  pendingAppointments,
  blogPosts,
  onViewAppointment, 
  onCancelAppointment,
  onConfirmAppointment,
  onRefuseAppointment,
  onValidateClient,
  onDeleteClient,
  onDeleteBlogPost,
  onShowBlogModal,
  refetchTodos,
  refetchReminders,
  refetchSchedule,
  refetchClients,
  refetchBlogPosts
}: any) {
  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Monthly Revenue</p>
                <p className="text-2xl font-bold">${metrics?.monthlyRevenue?.toLocaleString() || '0'}</p>
                <p className="text-sm text-blue-200 mt-1">+15% from last month</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Clients</p>
                <p className="text-2xl font-bold">{metrics?.totalClients || 0}</p>
                <p className="text-sm text-green-200 mt-1">{metrics?.totalAnimals || 0} pets total</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Appointments</p>
                <p className="text-2xl font-bold">{metrics?.totalAppointments || 0}</p>
                <p className="text-sm text-purple-200 mt-1">{metrics?.upcomingAppointments || 0} upcoming</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Pending Bookings</p>
                <p className="text-2xl font-bold">{metrics?.pendingAppointments || 0}</p>
                <p className="text-sm text-orange-200 mt-1">Need approval</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Appointments Section */}
      <PendingAppointmentsSection 
        pendingAppointments={pendingAppointments}
        onConfirm={onConfirmAppointment}
        onRefuse={onRefuseAppointment}
        onView={onViewAppointment}
      />

      {/* Admin Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Business To-Do List */}
        <EnhancedTodoList todos={todos} refetchTodos={refetchTodos} />

        {/* Enhanced Reminders */}
        <EnhancedReminders reminders={reminders} refetchReminders={refetchReminders} />

        {/* Client Management */}
        <ClientManagement 
          clients={clients}
          onValidate={onValidateClient}
          onDelete={onDeleteClient}
          refetchClients={refetchClients}
        />
      </div>

      {/* Blog Management */}
      <BlogManagement 
        blogPosts={blogPosts}
        onDelete={onDeleteBlogPost}
        onShowModal={onShowBlogModal}
        refetchBlogPosts={refetchBlogPosts}
      />

      {/* Enhanced Today's Schedule */}
      <EnhancedTodaySchedule 
        schedule={todaySchedule} 
        onViewAppointment={onViewAppointment}
        onCancelAppointment={onCancelAppointment}
        refetchSchedule={refetchSchedule}
      />
    </div>
  );
}

function EnhancedTodoList({ todos, refetchTodos }: any) {
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showAddForm, setShowAddForm] = useState(false);

  const addTodoMutation = useMutation({
    mutationFn: (data: { task: string; priority: string; dueDate?: string }) => 
      apiClient.createTodo(data),
    onSuccess: () => {
      refetchTodos();
      setNewTask('');
      setShowAddForm(false);
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

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      await addTodoMutation.mutateAsync({
        task: newTask.trim(),
        priority: newPriority
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span>Business To-Do List</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {todos.filter((t: any) => !t.completed).length} pending
            </Badge>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Todo Form */}
        {showAddForm && (
          <form onSubmit={handleAddTodo} className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Enter new task..."
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex items-center justify-between">
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <div className="flex space-x-2">
                  <Button type="submit" size="sm" disabled={addTodoMutation.isPending}>
                    Add Task
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Todo Items */}
        {todos.map((todo: TodoItem) => (
          <div key={todo.id} className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <button
              onClick={() => toggleTodoMutation.mutate(todo.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                todo.completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {todo.completed && <CheckCircleIcon className="w-3 h-3" />}
            </button>
            <div className="flex-1">
              <p className={`${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {todo.task}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getPriorityColor(todo.priority)}>
                  {todo.priority}
                </Badge>
                {todo.dueDate && (
                  <span className="text-xs text-gray-500">
                    Due: {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteTodoMutation.mutate(todo.id)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        
        {todos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No tasks yet. Add your first task!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EnhancedReminders({ reminders, refetchReminders }: any) {
  const [newReminder, setNewReminder] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addReminderMutation = useMutation({
    mutationFn: (data: { message: string; type: string; dueDate: string }) => 
      apiClient.createReminder(data),
    onSuccess: () => {
      refetchReminders();
      setNewReminder('');
      setShowAddForm(false);
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

  const upcomingReminders = reminders.filter((r: ReminderItem) => !r.completed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-blue-600" />
            <span>Reminders</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {upcomingReminders.length}
            </Badge>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newReminder.trim()) {
                addReminderMutation.mutate({
                  message: newReminder.trim(),
                  type: 'MANUAL',
                  dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
              }
            }}
            className="p-3 bg-orange-50 rounded-lg border-2 border-dashed border-orange-200"
          >
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                placeholder="Add reminder..."
                className="px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <div className="flex justify-end space-x-2">
                <Button type="submit" size="sm" disabled={addReminderMutation.isPending}>
                  Add
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        {upcomingReminders.map((reminder: ReminderItem) => (
          <div key={reminder.id} className="p-3 bg-white border border-orange-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{reminder.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {reminder.type} • Due: {new Date(reminder.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => markReminderDoneMutation.mutate(reminder.id)}
                  className="text-green-600 hover:text-green-800 p-1"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteReminderMutation.mutate(reminder.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {upcomingReminders.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <ClockIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">All caught up!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EnhancedTodaySchedule({ schedule, onViewAppointment, onCancelAppointment, refetchSchedule }: any) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-200';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            <span>Today's Schedule</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {schedule.length} appointments
            </Badge>
            <Button 
              size="sm" 
              variant="outline"
              onClick={refetchSchedule}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {schedule.map((appointment: any) => (
          <div key={appointment.id} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div>
                  <p className="font-semibold text-lg">
                    {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(appointment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-gray-600">
                    {appointment.client.firstName} {appointment.client.lastName} with {appointment.animal.name}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div>
                <p><strong>Service:</strong> {appointment.service.title}</p>
                <p><strong>Price:</strong> ${appointment.service.price}</p>
              </div>
              <div>
                <p><strong>Pet:</strong> {appointment.animal.name} ({appointment.animal.breed})</p>
                <p><strong>Duration:</strong> {appointment.service.duration} min</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{appointment.client.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{appointment.client.email}</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewAppointment(appointment)}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Details
                </Button>
                {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => onCancelAppointment(appointment.id)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            
            {appointment.notes && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-gray-700">
                <strong>Notes:</strong> {appointment.notes}
              </div>
            )}
          </div>
        ))}
        
        {schedule.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No appointments scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ClientDashboard({ animals, appointments, onViewAppointment, onCancelAppointment }: any) {
function ClientDashboard({ animals, appointments, onViewAppointment, onCancelAppointment, onAddTreatmentNote }: any) {
  const upcomingAppointments = appointments.filter((apt: any) => new Date(apt.startTime) > new Date());
  const pastAppointments = appointments.filter((apt: any) => new Date(apt.startTime) <= new Date());

  return (
    <div className="space-y-8">
      {/* Client Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <HeartIcon className="h-5 w-5 text-blue-600" />
              <span>My Pets</span>
            </CardTitle>
          </CardHeader>
                    <h3 className="font-semibold text-card-foreground">{treatment.service.title}</h3>
                    <p className="text-sm text-muted-foreground">
              <div key={treatment.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow bg-card">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground mt-1">
                      Duration: {treatment.service.duration} minutes • Cost: €{treatment.service.price}
                    <p className="text-muted-foreground">{animal.breed} • {animal.age} years old • {animal.weight}kg</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Healthy
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Visit:</span>
                    <span>{animal.appointments?.[0] ? new Date(animal.appointments[0].startTime).toLocaleDateString() : 'No visits yet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Appointment:</span>
                    <span>
                      {upcomingAppointments.find((apt: any) => apt.animalId === animal.id) 
                        ? new Date(upcomingAppointments.find((apt: any) => apt.animalId === animal.id).startTime).toLocaleDateString()
                        : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Visits:</span>
                    <span>{animal.appointments?.length || 0}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => onAddTreatmentNote(animal)}>
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    View Notes
                  </Button>
                </div>
                {animal.notes && (
                  <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted rounded">{animal.notes}</p>
                )}
              </div>
            ))}
            
            {animals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <HeartIcon className="h-12 w-12 mx-auto mb-3 text-muted" />
                <p>No pets registered yet</p>
                <Button className="mt-3" size="sm">Add Your First Pet</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-green-600" />
              <span>Upcoming Appointments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingAppointments.map((appointment: any) => (
              <div key={appointment.id} className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-card-foreground">{appointment.service.title}</h3>
                  <Badge className={appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {appointment.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>📅 {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>🐕 {appointment.animal.name} ({appointment.animal.breed})</p>
                  <p>💰 €{appointment.service.price}</p>
                  <p>⏱️ Duration: {appointment.service.duration} minutes</p>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewAppointment(appointment)}
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">Reschedule</Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => onCancelAppointment(appointment.id)}
                  >
                    Cancel
                  </Button>
                </div>
                {appointment.notes && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm text-muted-foreground">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            ))}
            
            {upcomingAppointments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-muted" />
                <p>No upcoming appointments</p>
                <Button className="mt-3" size="sm">Book Appointment</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Treatment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircleIcon className="h-5 w-5 text-purple-600" />
            <span>Treatment History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pastAppointments.map((treatment: any) => (
            <div key={treatment.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{treatment.service.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(treatment.startTime).toLocaleDateString()} • {treatment.animal.name} ({treatment.animal.breed})
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {treatment.service.duration} minutes • Cost: ${treatment.service.price}
                  </p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Completed
                </Badge>
              </div>
              
              {treatment.notes && (
                <div className="mb-3 p-3 bg-muted rounded text-sm text-muted-foreground">
                  <strong>Treatment Notes:</strong> {treatment.notes}
                </div>
              )}
              
              {treatment.treatmentNotes?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {treatment.treatmentNotes.map((note: any, index: number) => (
                    <Button key={index} size="sm" variant="outline" className="text-xs">
                      📄 Treatment Note {index + 1}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-4 text-xs text-muted-foreground">
                  <span>Practitioner: Dr. Smith</span>
                  <span>Status: {treatment.status}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewAppointment(treatment)}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
          
          {pastAppointments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-muted" />
              <p>No treatment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats for Client */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <HeartIcon className="h-8 w-8 mx-auto mb-2 text-blue-200" />
              <p className="text-2xl font-bold">{animals.length}</p>
              <p className="text-blue-100">Registered Pets</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-green-200" />
              <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
              <p className="text-green-100">Upcoming Visits</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-center">
              <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-purple-200" />
              <p className="text-2xl font-bold">{pastAppointments.length}</p>
              <p className="text-purple-100">Completed Visits</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// New Components for Enhanced Features
function PendingAppointmentsSection({ pendingAppointments, onConfirm, onRefuse, onView }: any) {
  if (pendingAppointments.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
          <span>Pending Appointments ({pendingAppointments.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingAppointments.map((appointment: any) => (
          <div key={appointment.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground">
                  {appointment.client.firstName} {appointment.client.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {appointment.animal.name} ({appointment.animal.breed}) • {appointment.service.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => onView(appointment)} variant="outline">
                  <EyeIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => onConfirm(appointment.id)} className="bg-green-600 hover:bg-green-700">
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => onRefuse(appointment.id)} variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  <XCircleIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ClientManagement({ clients, onValidate, onDelete, refetchClients }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5 text-blue-600" />
          <span>Client Management</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {clients.slice(0, 5).map((client: any) => (
          <div key={client.id} className="p-3 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-card-foreground">
                  {client.firstName} {client.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">{client.email}</p>
                <p className="text-xs text-muted-foreground">
                  {client.animals.length} pets • {client.appointments.length} appointments
                </p>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="outline" onClick={() => onValidate(client.id)}>
                  <CheckIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDelete(client.id)}>
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BlogManagement({ blogPosts, onDelete, onShowModal, refetchBlogPosts }: any) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-purple-600" />
            <span>Blog Management</span>
          </CardTitle>
          <Button size="sm" onClick={onShowModal} className="bg-purple-600 hover:bg-purple-700">
            <PlusIcon className="h-4 w-4 mr-1" />
            New Article
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {blogPosts.slice(0, 3).map((post: any) => (
          <div key={post.id} className="p-3 border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-card-foreground">{post.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {post.published ? 'Published' : 'Draft'} • {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-1">
                <Button size="sm" variant="outline">
                  <PencilIcon className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" className="text-red-600" onClick={() => onDelete(post.id)}>
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Blog Post Creation Modal
function BlogPostModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    title: '',
    titleFr: '',
    excerpt: '',
    excerptFr: '',
    content: '',
    contentFr: '',
    coverImage: '',
    published: false,
    seoTitle: '',
    seoTitleFr: '',
    seoDesc: '',
    seoDescFr: ''
  });

  const createBlogPostMutation = useMutation({
    mutationFn: (data: any) => apiClient.createBlogPost(data),
    onSuccess: () => {
      onSuccess();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBlogPostMutation.mutateAsync(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Create New Blog Post</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title (English)</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Title (French)</label>
              <Input
                value={formData.titleFr}
                onChange={(e) => setFormData(prev => ({ ...prev, titleFr: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Excerpt (English)</label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Excerpt (French)</label>
              <Textarea
                value={formData.excerptFr}
                onChange={(e) => setFormData(prev => ({ ...prev, excerptFr: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Cover Image URL</label>
            <Input
              value={formData.coverImage}
              onChange={(e) => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
              placeholder="https://images.pexels.com/..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Content (English)</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Content (French)</label>
              <Textarea
                value={formData.contentFr}
                onChange={(e) => setFormData(prev => ({ ...prev, contentFr: e.target.value }))}
                rows={8}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
              className="rounded border-border"
            />
            <label htmlFor="published" className="text-sm font-medium text-foreground">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBlogPostMutation.isPending}>
              {createBlogPostMutation.isPending ? 'Creating...' : 'Create Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Treatment Note Modal
function TreatmentNoteModal({ animal, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    content: '',
    diagnosis: '',
    treatment: '',
    followUp: ''
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Treatment Notes - {animal.name}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Pet Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {animal.name}
              </div>
              <div>
                <span className="text-muted-foreground">Breed:</span> {animal.breed}
              </div>
              <div>
                <span className="text-muted-foreground">Age:</span> {animal.age} years
              </div>
              <div>
                <span className="text-muted-foreground">Weight:</span> {animal.weight}kg
              </div>
            </div>
          </div>

          {/* Display existing treatment notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Treatment History</h3>
            {animal.treatmentNotes?.length > 0 ? (
              animal.treatmentNotes.map((note: any, index: number) => (
                <div key={index} className="p-4 border border-border rounded-lg bg-card">
                  <div className="text-sm text-muted-foreground mb-2">
                    {new Date(note.createdAt).toLocaleDateString()} by {note.practitioner?.firstName} {note.practitioner?.lastName}
                  </div>
                  <p className="text-card-foreground">{note.content}</p>
                  {note.diagnosis && (
                    <div className="mt-2">
                      <span className="font-medium">Diagnosis:</span> {note.diagnosis}
                    </div>
                  )}
                  {note.treatment && (
                    <div className="mt-1">
                      <span className="font-medium">Treatment:</span> {note.treatment}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No treatment notes yet.</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-border mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Appointment Details Modal Component
function AppointmentModal({ appointment, onClose, onCancel, onConfirm, onRefuse }: any) {
  const [refuseReason, setRefuseReason] = useState('');
  const [showRefuseForm, setShowRefuseForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const startDateTime = formatDateTime(appointment.startTime);
  const endDateTime = formatDateTime(appointment.endTime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Appointment Details</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Service */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-foreground">{appointment.service.title}</h3>
              <p className="text-muted-foreground">{appointment.service.description}</p>
            </div>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📅 Date & Time</h4>
              <p className="text-blue-800">{startDateTime.date}</p>
              <p className="text-blue-700">{startDateTime.time} - {endDateTime.time}</p>
              <p className="text-sm text-blue-600 mt-1">Duration: {appointment.service.duration} minutes</p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">💰 Payment</h4>
              <p className="text-green-800 text-lg font-semibold">€{appointment.service.price}</p>
              <p className="text-sm text-green-600">Service fee</p>
            </div>
          </div>

          {/* Client and Pet Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">👤 Client Information</h4>
              <p className="text-purple-800 font-medium">
                {appointment.client.firstName} {appointment.client.lastName}
              </p>
              <div className="space-y-1 mt-2 text-sm text-purple-700">
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>{appointment.client.email}</span>
                </div>
                {appointment.client.phone && (
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{appointment.client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">🐕 Pet Information</h4>
              <p className="text-orange-800 font-medium">{appointment.animal.name}</p>
              <div className="space-y-1 mt-2 text-sm text-orange-700">
                <p>Breed: {appointment.animal.breed}</p>
                <p>Age: {appointment.animal.age} years old</p>
                <p>Weight: {appointment.animal.weight || 'N/A'} kg</p>
                <p>Gender: {appointment.animal.gender}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {appointment.notes && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">📝 Notes</h4>
              <p className="text-muted-foreground">{appointment.notes}</p>
            </div>
          )}

          {/* Treatment Notes (for completed appointments) */}
          {appointment.treatmentNotes?.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🏥 Treatment Notes</h4>
              <div className="space-y-3">
                {appointment.treatmentNotes.map((note: any, index: number) => (
                  <div key={index} className="bg-background p-3 rounded border border-border">
                    <div className="text-sm text-muted-foreground mb-1">
                      {new Date(note.createdAt).toLocaleDateString()} by {note.practitioner.firstName} {note.practitioner.lastName}
                    </div>
                    <p className="text-foreground">{note.content}</p>
                    {note.diagnosis && (
                      <div className="mt-2">
                        <span className="font-medium">Diagnosis:</span> {note.diagnosis}
                      </div>
                    )}
                    {note.treatment && (
                      <div className="mt-1">
                        <span className="font-medium">Treatment:</span> {note.treatment}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Refuse Form */}
          {showRefuseForm && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Reason for Refusal</h4>
              <Textarea
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                placeholder="Please provide a reason for refusing this appointment..."
                rows={3}
              />
              <div className="flex space-x-2 mt-3">
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => {
                    onRefuse(refuseReason);
                    onClose();
                  }}
                >
                  Confirm Refusal
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowRefuseForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-border">
            {onConfirm && appointment.status === 'SCHEDULED' && (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            )}
            {onRefuse && appointment.status === 'SCHEDULED' && !showRefuseForm && (
              <Button 
                variant="outline" 
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowRefuseForm(true)}
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Refuse
              </Button>
            )}
            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
              <>
                <Button variant="outline">
                  Reschedule
                </Button>
                {!onConfirm && (
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      onCancel();
                      onClose();
                    }}
                  >
                    Cancel Appointment
                  </Button>
                )}
              </>
            )}
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;