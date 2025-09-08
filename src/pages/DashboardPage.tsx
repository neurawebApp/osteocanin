// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
  ExclamationTriangleIcon
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
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const animals = animalsData?.data || [];
  const appointments = appointmentsData?.data || [];
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

  const handleViewAppointmentDetails = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
  };

  const isAdmin = user.role === 'ADMIN' || user.role === 'PRACTITIONER';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">
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
            onViewAppointment={handleViewAppointmentDetails}
            onCancelAppointment={handleCancelAppointment}
            refetchTodos={refetchTodos}
            refetchReminders={refetchReminders}
            refetchSchedule={refetchSchedule}
          />
        ) : (
          <ClientDashboard 
            animals={animals} 
            appointments={appointments}
            onViewAppointment={handleViewAppointmentDetails}
            onCancelAppointment={handleCancelAppointment}
          />
        )}
      </div>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <AppointmentModal 
          appointment={selectedAppointment}
          onClose={() => setShowAppointmentModal(false)}
          onCancel={() => handleCancelAppointment(selectedAppointment.id)}
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
  onViewAppointment, 
  onCancelAppointment,
  refetchTodos,
  refetchReminders,
  refetchSchedule
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
                <p className="text-orange-100">Pending Contacts</p>
                <p className="text-2xl font-bold">{metrics?.pendingContacts || 0}</p>
                <p className="text-sm text-orange-200 mt-1">Need response</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Enhanced Business To-Do List */}
        <EnhancedTodoList todos={todos} refetchTodos={refetchTodos} />

        {/* Enhanced Reminders */}
        <EnhancedReminders reminders={reminders} refetchReminders={refetchReminders} />
      </div>

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
          <CardContent className="space-y-4">
            {animals.map((animal: any) => (
              <div key={animal.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{animal.name}</h3>
                    <p className="text-gray-600">{animal.breed} • {animal.age} years old • {animal.weight}kg</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Healthy
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Visit:</span>
                    <span>{animal.appointments?.[0] ? new Date(animal.appointments[0].startTime).toLocaleDateString() : 'No visits yet'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Next Appointment:</span>
                    <span>
                      {upcomingAppointments.find((apt: any) => apt.animalId === animal.id) 
                        ? new Date(upcomingAppointments.find((apt: any) => apt.animalId === animal.id).startTime).toLocaleDateString()
                        : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Visits:</span>
                    <span>{animal.appointments?.length || 0}</span>
                  </div>
                </div>
                {animal.notes && (
                  <p className="text-sm text-gray-600 mt-3 p-3 bg-blue-50 rounded">{animal.notes}</p>
                )}
              </div>
            ))}
            
            {animals.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <HeartIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
              <div key={appointment.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{appointment.service.title}</h3>
                  <Badge className={appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {appointment.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📅 {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p>🐕 {appointment.animal.name} ({appointment.animal.breed})</p>
                  <p>💰 ${appointment.service.price}</p>
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
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-gray-700">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            ))}
            
            {upcomingAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                <div className="mb-3 p-3 bg-blue-50 rounded text-sm text-gray-700">
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
                <div className="flex space-x-4 text-xs text-gray-500">
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
            <div className="text-center py-8 text-gray-500">
              <CheckCircleIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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

// Appointment Details Modal Component
function AppointmentModal({ appointment, onClose, onCancel }: any) {
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Service */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{appointment.service.title}</h3>
              <p className="text-gray-600">{appointment.service.description}</p>
            </div>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">📅 Date & Time</h4>
              <p className="text-blue-800">{startDateTime.date}</p>
              <p className="text-blue-700">{startDateTime.time} - {endDateTime.time}</p>
              <p className="text-sm text-blue-600 mt-1">Duration: {appointment.service.duration} minutes</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">💰 Payment</h4>
              <p className="text-green-800 text-lg font-semibold">${appointment.service.price}</p>
              <p className="text-sm text-green-600">Service fee</p>
            </div>
          </div>

          {/* Client and Pet Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
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

            <div className="bg-orange-50 p-4 rounded-lg">
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">📝 Notes</h4>
              <p className="text-gray-700">{appointment.notes}</p>
            </div>
          )}

          {/* Treatment Notes (for completed appointments) */}
          {appointment.treatmentNotes?.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">🏥 Treatment Notes</h4>
              <div className="space-y-3">
                {appointment.treatmentNotes.map((note: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="text-sm text-gray-600 mb-1">
                      {new Date(note.createdAt).toLocaleDateString()} by {note.practitioner.firstName} {note.practitioner.lastName}
                    </div>
                    <p className="text-gray-800">{note.content}</p>
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

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
              <>
                <Button variant="outline">
                  Reschedule
                </Button>
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