import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
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
  XCircleIcon,
  TrashIcon,
  EyeIcon,
  BellIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [newTodo, setNewTodo] = useState({ task: '', priority: 'medium', dueDate: '', description: '' });
  const [newReminder, setNewReminder] = useState({ message: '', dueDate: '', priority: 'medium' });
  const [newBlogPost, setNewBlogPost] = useState({
    title: '', titleFr: '', excerpt: '', excerptFr: '', content: '', contentFr: '', 
    coverImage: '', published: false
  });
  const [newTreatmentNote, setNewTreatmentNote] = useState({
    appointmentId: '', animalId: '', content: '', diagnosis: '', treatment: '', followUp: ''
  });

  // Queries
  const { data: metricsData } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiClient.getDashboardMetrics(),
    enabled: isAdmin
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => apiClient.getAppointments()
  });

  const { data: pendingAppointmentsData } = useQuery({
    queryKey: ['pending-appointments'],
    queryFn: () => apiClient.getPendingAppointments(),
    enabled: isAdmin
  });

  const { data: todosData } = useQuery({
    queryKey: ['todos'],
    queryFn: () => apiClient.getTodos(),
    enabled: isAdmin
  });

  const { data: remindersData } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => apiClient.getReminders(),
    enabled: isAdmin
  });

  const { data: blogPostsData } = useQuery({
    queryKey: ['admin-blog-posts'],
    queryFn: () => apiClient.getAdminBlogPosts(),
    enabled: isAdmin
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient.getClients(),
    enabled: isAdmin
  });

  const { data: animalsData } = useQuery({
    queryKey: ['animals'],
    queryFn: () => apiClient.getAnimals()
  });

  const { data: scheduleData } = useQuery({
    queryKey: ['today-schedule'],
    queryFn: () => apiClient.getTodaySchedule(),
    enabled: isAdmin
  });

  // Mutations
  const confirmAppointmentMutation = useMutation({
    mutationFn: (id: string) => apiClient.confirmAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const refuseAppointmentMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => apiClient.refuseAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });

  const createTodoMutation = useMutation({
    mutationFn: (data: any) => apiClient.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setNewTodo({ task: '', priority: 'medium', dueDate: '', description: '' });
    }
  });

  const toggleTodoMutation = useMutation({
    mutationFn: (id: string) => apiClient.toggleTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    }
  });

  const createReminderMutation = useMutation({
    mutationFn: (data: any) => apiClient.createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setNewReminder({ message: '', dueDate: '', priority: 'medium' });
    }
  });

  const markReminderDoneMutation = useMutation({
    mutationFn: (id: string) => apiClient.markReminderDone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const createBlogPostMutation = useMutation({
    mutationFn: (data: any) => apiClient.createBlogPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      setNewBlogPost({
        title: '', titleFr: '', excerpt: '', excerptFr: '', content: '', contentFr: '', 
        coverImage: '', published: false
      });
    }
  });

  const deleteBlogPostMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteBlogPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-blog-posts'] });
    }
  });

  const validateClientMutation = useMutation({
    mutationFn: (id: string) => apiClient.validateClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const deleteClientMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });

  const createTreatmentNoteMutation = useMutation({
    mutationFn: (data: any) => apiClient.createTreatmentNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setNewTreatmentNote({
        appointmentId: '', animalId: '', content: '', diagnosis: '', treatment: '', followUp: ''
      });
    }
  });

  const metrics = metricsData?.data;
  const appointments = appointmentsData?.data || [];
  const pendingAppointments = pendingAppointmentsData?.data || [];
  const todos = todosData?.data || [];
  const reminders = remindersData?.data || [];
  const blogPosts = blogPostsData?.data || [];
  const clients = clientsData?.data || [];
  const animals = animalsData?.data || [];
  const schedule = scheduleData?.data || [];

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.task.trim()) {
      createTodoMutation.mutate(newTodo);
    }
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReminder.message.trim() && newReminder.dueDate) {
      createReminderMutation.mutate({
        ...newReminder,
        type: 'MANUAL'
      });
    }
  };

  const handleCreateBlogPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBlogPost.title.trim() && newBlogPost.content.trim()) {
      createBlogPostMutation.mutate(newBlogPost);
    }
  };

  const handleCreateTreatmentNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTreatmentNote.content.trim() && newTreatmentNote.appointmentId) {
      createTreatmentNoteMutation.mutate(newTreatmentNote);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'appointments', label: 'Appointments', icon: CalendarIcon },
    { id: 'todos', label: 'Tasks', icon: DocumentTextIcon, adminOnly: true },
    { id: 'reminders', label: 'Reminders', icon: BellIcon, adminOnly: true },
    { id: 'blog', label: 'Blog', icon: PencilIcon, adminOnly: true },
    { id: 'clients', label: 'Clients', icon: UserGroupIcon, adminOnly: true },
    { id: 'treatments', label: 'Treatments', icon: HeartIcon, adminOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isAdmin ? 'Admin Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.firstName}! Here's what's happening today.
          </p>
        </div>

        {/* Metrics Cards (Admin Only) */}
        {isAdmin && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3">
                    <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                    <HeartIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Animals</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.totalAnimals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full p-3">
                    <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Appointments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics.pendingAppointments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3">
                    <CurrencyEuroIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">€{metrics.monthlyRevenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {filteredTabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Appointments */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Recent Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {appointment.animal?.name} - {appointment.service?.title}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <Badge variant={appointment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments found</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Link to="/booking">
                      <Button className="w-full justify-start">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Book New Appointment
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start dark:border-gray-600 dark:text-gray-300"
                          onClick={() => setActiveTab('blog')}
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Create Blog Post
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start dark:border-gray-600 dark:text-gray-300"
                          onClick={() => setActiveTab('todos')}
                        >
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Schedule (Admin Only) */}
              {isAdmin && (
                <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="dark:text-white">Today's Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {schedule.map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                              <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(appointment.startTime).toLocaleTimeString()} - {appointment.client?.firstName} {appointment.client?.lastName}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {appointment.animal?.name} ({appointment.animal?.breed}) - {appointment.service?.title}
                              </p>
                            </div>
                          </div>
                          <Badge variant={appointment.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                            {appointment.status}
                          </Badge>
                        </div>
                      ))}
                      {schedule.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments scheduled for today</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              {/* Pending Appointments (Admin Only) */}
              {isAdmin && pendingAppointments.length > 0 && (
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center dark:text-white">
                      <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-500" />
                      Pending Appointments ({pendingAppointments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingAppointments.map((appointment: any) => (
                        <div key={appointment.id} className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {appointment.client?.firstName} {appointment.client?.lastName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {appointment.animal?.name} ({appointment.animal?.breed}) - {appointment.service?.title}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                  {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => confirmAppointmentMutation.mutate(appointment.id)}
                              disabled={confirmAppointmentMutation.isPending}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refuseAppointmentMutation.mutate({ id: appointment.id })}
                              disabled={refuseAppointmentMutation.isPending}
                            >
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Refuse
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Appointments */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">All Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {isAdmin ? `${appointment.client?.firstName} ${appointment.client?.lastName}` : appointment.service?.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {appointment.animal?.name} ({appointment.animal?.breed})
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {new Date(appointment.startTime).toLocaleDateString()} at {new Date(appointment.startTime).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={appointment.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {appointment.status}
                          </Badge>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-white">€{appointment.service?.price}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">{appointment.service?.duration}min</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No appointments found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks Tab (Admin Only) */}
          {activeTab === 'todos' && isAdmin && (
            <div className="space-y-6">
              {/* Add New Task */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Add New Task</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTodo} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task" className="dark:text-gray-300">Task *</Label>
                        <Input
                          id="task"
                          value={newTodo.task}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, task: e.target.value }))}
                          placeholder="Enter task description"
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="priority" className="dark:text-gray-300">Priority</Label>
                        <Select value={newTodo.priority} onValueChange={(value) => setNewTodo(prev => ({ ...prev, priority: value }))}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dueDate" className="dark:text-gray-300">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="datetime-local"
                          value={newTodo.dueDate}
                          onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description" className="dark:text-gray-300">Description</Label>
                      <Textarea
                        id="description"
                        value={newTodo.description}
                        onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Additional details..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <Button type="submit" disabled={createTodoMutation.isPending}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Tasks List */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Tasks ({todos.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {todos.map((todo: any) => (
                      <div key={todo.id} className={`flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg ${todo.completed ? 'opacity-60' : ''}`}>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleTodoMutation.mutate(todo.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              todo.completed 
                                ? 'bg-green-500 border-green-500' 
                                : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                            }`}
                          >
                            {todo.completed && <CheckCircleIcon className="h-3 w-3 text-white" />}
                          </button>
                          <div>
                            <p className={`font-medium ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
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
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={todo.priority === 'high' ? 'destructive' : todo.priority === 'medium' ? 'default' : 'secondary'}>
                            {todo.priority}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTodoMutation.mutate(todo.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {todos.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No tasks found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reminders Tab (Admin Only) */}
          {activeTab === 'reminders' && isAdmin && (
            <div className="space-y-6">
              {/* Add New Reminder */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Add New Reminder</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateReminder} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="message" className="dark:text-gray-300">Message *</Label>
                        <Input
                          id="message"
                          value={newReminder.message}
                          onChange={(e) => setNewReminder(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Reminder message"
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reminderDate" className="dark:text-gray-300">Remind At *</Label>
                        <Input
                          id="reminderDate"
                          type="datetime-local"
                          value={newReminder.dueDate}
                          onChange={(e) => setNewReminder(prev => ({ ...prev, dueDate: e.target.value }))}
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={createReminderMutation.isPending}>
                      <BellIcon className="h-4 w-4 mr-2" />
                      Add Reminder
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Reminders List */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Reminders ({reminders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reminders.map((reminder: any) => (
                      <div key={reminder.id} className={`flex items-center justify-between p-3 border dark:border-gray-600 rounded-lg ${reminder.completed ? 'opacity-60' : ''}`}>
                        <div>
                          <p className={`font-medium ${reminder.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {reminder.message}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(reminder.dueDate).toLocaleDateString()} at {new Date(reminder.dueDate).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!reminder.completed && (
                            <Button
                              size="sm"
                              onClick={() => markReminderDoneMutation.mutate(reminder.id)}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteReminderMutation.mutate(reminder.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {reminders.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No reminders found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Blog Tab (Admin Only) */}
          {activeTab === 'blog' && isAdmin && (
            <div className="space-y-6">
              {/* Create New Blog Post */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Create New Blog Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateBlogPost} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title" className="dark:text-gray-300">Title (English) *</Label>
                        <Input
                          id="title"
                          value={newBlogPost.title}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Blog post title"
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="titleFr" className="dark:text-gray-300">Title (French) *</Label>
                        <Input
                          id="titleFr"
                          value={newBlogPost.titleFr}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, titleFr: e.target.value }))}
                          placeholder="Titre du blog"
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="excerpt" className="dark:text-gray-300">Excerpt (English)</Label>
                        <Textarea
                          id="excerpt"
                          value={newBlogPost.excerpt}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, excerpt: e.target.value }))}
                          placeholder="Brief description..."
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="excerptFr" className="dark:text-gray-300">Excerpt (French)</Label>
                        <Textarea
                          id="excerptFr"
                          value={newBlogPost.excerptFr}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, excerptFr: e.target.value }))}
                          placeholder="Brève description..."
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="coverImage" className="dark:text-gray-300">Cover Image URL</Label>
                      <Input
                        id="coverImage"
                        value={newBlogPost.coverImage}
                        onChange={(e) => setNewBlogPost(prev => ({ ...prev, coverImage: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="content" className="dark:text-gray-300">Content (English) *</Label>
                        <Textarea
                          id="content"
                          value={newBlogPost.content}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, content: e.target.value }))}
                          placeholder="Blog post content..."
                          rows={6}
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contentFr" className="dark:text-gray-300">Content (French) *</Label>
                        <Textarea
                          id="contentFr"
                          value={newBlogPost.contentFr}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, contentFr: e.target.value }))}
                          placeholder="Contenu du blog..."
                          rows={6}
                          required
                          className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newBlogPost.published}
                          onChange={(e) => setNewBlogPost(prev => ({ ...prev, published: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                      </label>
                    </div>
                    <Button type="submit" disabled={createBlogPostMutation.isPending}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Blog Post
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Blog Posts List */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Blog Posts ({blogPosts.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {blogPosts.map((post: any) => (
                      <div key={post.id} className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{post.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{post.excerpt}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Created: {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={post.published ? 'default' : 'secondary'}>
                            {post.published ? 'Published' : 'Draft'}
                          </Badge>
                          <Link to={`/blog/${post.slug}`}>
                            <Button size="sm" variant="outline">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteBlogPostMutation.mutate(post.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {blogPosts.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No blog posts found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Clients Tab (Admin Only) */}
          {activeTab === 'clients' && isAdmin && (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="dark:text-white">Client Management ({clients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map((client: any) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2">
                          <UserIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {client.firstName} {client.lastName}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              {client.email}
                            </span>
                            {client.phone && (
                              <span className="flex items-center">
                                <PhoneIcon className="h-3 w-3 mr-1" />
                                {client.phone}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {client.animals?.length || 0} animals, {client.appointments?.length || 0} appointments
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => validateClientMutation.mutate(client.id)}
                          disabled={validateClientMutation.isPending}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Validate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteClientMutation.mutate(client.id)}
                          disabled={deleteClientMutation.isPending}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {clients.length === 0 && (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">No clients found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatments Tab (Admin Only) */}
          {activeTab === 'treatments' && isAdmin && (
            <div className="space-y-6">
              {/* Add Treatment Note */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Add Treatment Note</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTreatmentNote} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="appointmentId" className="dark:text-gray-300">Appointment *</Label>
                        <Select value={newTreatmentNote.appointmentId} onValueChange={(value) => setNewTreatmentNote(prev => ({ ...prev, appointmentId: value }))}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <SelectValue placeholder="Select appointment" />
                          </SelectTrigger>
                          <SelectContent>
                            {appointments.filter((apt: any) => apt.status === 'COMPLETED').map((appointment: any) => (
                              <SelectItem key={appointment.id} value={appointment.id}>
                                {appointment.client?.firstName} {appointment.client?.lastName} - {appointment.animal?.name} ({new Date(appointment.startTime).toLocaleDateString()})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="animalId" className="dark:text-gray-300">Animal *</Label>
                        <Select value={newTreatmentNote.animalId} onValueChange={(value) => setNewTreatmentNote(prev => ({ ...prev, animalId: value }))}>
                          <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                            <SelectValue placeholder="Select animal" />
                          </SelectTrigger>
                          <SelectContent>
                            {animals.map((animal: any) => (
                              <SelectItem key={animal.id} value={animal.id}>
                                {animal.name} ({animal.breed})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="diagnosis" className="dark:text-gray-300">Diagnosis</Label>
                      <Input
                        id="diagnosis"
                        value={newTreatmentNote.diagnosis}
                        onChange={(e) => setNewTreatmentNote(prev => ({ ...prev, diagnosis: e.target.value }))}
                        placeholder="Primary diagnosis"
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="treatment" className="dark:text-gray-300">Treatment</Label>
                      <Textarea
                        id="treatment"
                        value={newTreatmentNote.treatment}
                        onChange={(e) => setNewTreatmentNote(prev => ({ ...prev, treatment: e.target.value }))}
                        placeholder="Treatment provided..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="content" className="dark:text-gray-300">Session Notes *</Label>
                      <Textarea
                        id="content"
                        value={newTreatmentNote.content}
                        onChange={(e) => setNewTreatmentNote(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Detailed session notes..."
                        rows={4}
                        required
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="followUp" className="dark:text-gray-300">Follow-up Instructions</Label>
                      <Textarea
                        id="followUp"
                        value={newTreatmentNote.followUp}
                        onChange={(e) => setNewTreatmentNote(prev => ({ ...prev, followUp: e.target.value }))}
                        placeholder="Follow-up care instructions..."
                        className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <Button type="submit" disabled={createTreatmentNoteMutation.isPending}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Treatment Note
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Recent Treatment Notes */}
              <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="dark:text-white">Recent Treatment Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {appointments
                      .filter((apt: any) => apt.treatmentNotes && apt.treatmentNotes.length > 0)
                      .slice(0, 10)
                      .map((appointment: any) => (
                        <div key={appointment.id} className="border dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {appointment.animal?.name} ({appointment.animal?.breed})
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Owner: {appointment.client?.firstName} {appointment.client?.lastName}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(appointment.startTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {appointment.treatmentNotes.map((note: any) => (
                            <div key={note.id} className="bg-gray-50 dark:bg-gray-700 rounded p-3 mt-2">
                              {note.diagnosis && (
                                <p className="text-sm mb-2">
                                  <strong className="text-gray-900 dark:text-white">Diagnosis:</strong> 
                                  <span className="text-gray-700 dark:text-gray-300 ml-1">{note.diagnosis}</span>
                                </p>
                              )}
                              <p className="text-sm mb-2">
                                <strong className="text-gray-900 dark:text-white">Notes:</strong> 
                                <span className="text-gray-700 dark:text-gray-300 ml-1">{note.content}</span>
                              </p>
                              {note.treatment && (
                                <p className="text-sm mb-2">
                                  <strong className="text-gray-900 dark:text-white">Treatment:</strong> 
                                  <span className="text-gray-700 dark:text-gray-300 ml-1">{note.treatment}</span>
                                </p>
                              )}
                              {note.followUp && (
                                <p className="text-sm">
                                  <strong className="text-gray-900 dark:text-white">Follow-up:</strong> 
                                  <span className="text-gray-700 dark:text-gray-300 ml-1">{note.followUp}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;