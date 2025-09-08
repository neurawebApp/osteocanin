import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { CalendarIcon, ClockIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type BookingStep = 'service' | 'animal' | 'datetime' | 'details' | 'confirmation';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

const BookingPage: React.FC = () => {
  // Fetch services dynamically
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiClient.getServices(true)
  });

  const services = servicesData?.data || [];
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [formData, setFormData] = useState({
    serviceId: '',
    animalName: '',
    animalBreed: '',
    animalAge: '',
    animalWeight: '',
    selectedDate: '',
    selectedTime: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: ''
  });

  const selectedService = services.find(s => s.id === formData.serviceId);

  const handleNext = () => {
    const steps: BookingStep[] = ['service', 'animal', 'datetime', 'details', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: BookingStep[] = ['service', 'animal', 'datetime', 'details', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    console.log('Booking submitted:', formData);
    setCurrentStep('confirmation');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {['Service', 'Animal', 'Date & Time', 'Details', 'Confirmation'].map((step, index) => {
                const stepKeys: BookingStep[] = ['service', 'animal', 'datetime', 'details', 'confirmation'];
                const isActive = stepKeys[index] === currentStep;
                const isCompleted = stepKeys.indexOf(currentStep) > index;
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}
                    `}>
                      {isCompleted ? <CheckCircleIcon className="h-4 w-4" /> : index + 1}
                    </div>
                    {index < 4 && (
                      <div className={`w-16 h-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Book Your Appointment</h1>
              <p className="text-gray-600">Step {['service', 'animal', 'datetime', 'details', 'confirmation'].indexOf(currentStep) + 1} of 5</p>
            </div>
          </div>

          {/* Step Content */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              {currentStep === 'service' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Select Your Service</h2>
                  {servicesLoading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {services.map((service: any) => (
                        <div
                          key={service.id}
                          className={`
                            border rounded-lg p-4 cursor-pointer transition-all duration-200
                            ${formData.serviceId === service.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }
                          `}
                          onClick={() => setFormData(prev => ({ ...prev, serviceId: service.id }))}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{service.title}</h3>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <ClockIcon className="h-3 w-3 mr-1" />
                                  {service.duration} min
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">€{service.price}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'animal' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Tell Us About Your Dog</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="animalName">Dog's Name *</Label>
                      <Input
                        id="animalName"
                        value={formData.animalName}
                        onChange={(e) => setFormData(prev => ({ ...prev, animalName: e.target.value }))}
                        placeholder="e.g., Max"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="animalBreed">Breed *</Label>
                      <Input
                        id="animalBreed"
                        value={formData.animalBreed}
                        onChange={(e) => setFormData(prev => ({ ...prev, animalBreed: e.target.value }))}
                        placeholder="e.g., Golden Retriever"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="animalAge">Age *</Label>
                      <Input
                        id="animalAge"
                        value={formData.animalAge}
                        onChange={(e) => setFormData(prev => ({ ...prev, animalAge: e.target.value }))}
                        placeholder="e.g., 3 years"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="animalWeight">Weight (kg) *</Label>
                      <Input
                        id="animalWeight"
                        value={formData.animalWeight}
                        onChange={(e) => setFormData(prev => ({ ...prev, animalWeight: e.target.value }))}
                        placeholder="e.g., 25"
                        type="number"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'datetime' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Choose Date & Time</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <Label className="text-base font-medium">Select Date</Label>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {Array.from({ length: 14 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() + i + 1);
                          const dateStr = date.toISOString().split('T')[0];
                          const isSelected = formData.selectedDate === dateStr;
                          
                          return (
                            <Button
                              key={i}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              className={`h-12 ${isSelected ? 'bg-blue-600' : ''}`}
                              onClick={() => setFormData(prev => ({ ...prev, selectedDate: dateStr }))}
                            >
                              <div className="text-center">
                                <div className="text-xs">{date.toLocaleDateString('en', { weekday: 'short' })}</div>
                                <div className="font-semibold">{date.getDate()}</div>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Select Time</Label>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={formData.selectedTime === time ? 'default' : 'outline'}
                            size="sm"
                            className={formData.selectedTime === time ? 'bg-blue-600' : ''}
                            onClick={() => setFormData(prev => ({ ...prev, selectedTime: time }))}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {selectedService && formData.selectedDate && formData.selectedTime && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">Booking Summary</h3>
                      <div className="text-sm text-blue-800">
                        <p><strong>Service:</strong> {selectedService.name}</p>
                        <p><strong>Duration:</strong> {selectedService.duration} minutes</p>
                        <p><strong>Price:</strong> €{selectedService.price}</p>
                        <p><strong>Date:</strong> {new Date(formData.selectedDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {formData.selectedTime}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'details' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="clientName">Your Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Email Address *</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                        placeholder="your.email@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="clientPhone">Phone Number *</Label>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any specific concerns, symptoms, or information about your dog..."
                        className="mt-1"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'confirmation' && (
                <div className="text-center">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-600">Your appointment has been successfully scheduled.</p>
                  </div>
                  
                  <Card className="bg-blue-50 border-blue-200 max-w-md mx-auto mb-6">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-blue-900 mb-4">Appointment Details</h3>
                      <div className="text-left space-y-2 text-sm">
                        <p><strong>Service:</strong> {selectedService?.name}</p>
                        <p><strong>Dog:</strong> {formData.animalName} ({formData.animalBreed})</p>
                        <p><strong>Date:</strong> {new Date(formData.selectedDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {formData.selectedTime}</p>
                        <p><strong>Duration:</strong> {selectedService?.duration} minutes</p>
                        <p><strong>Total Cost:</strong> €{selectedService?.price}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      A confirmation email has been sent to {formData.clientEmail}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link to="/dashboard">
                        <Button>Go to Dashboard</Button>
                      </Link>
                      <Link to="/">
                        <Button variant="outline">Return Home</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep !== 'confirmation' && (
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 'service'}
                    className="flex items-center"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  {currentStep === 'details' ? (
                    <Button onClick={handleSubmit} className="flex items-center bg-blue-600 hover:bg-blue-700">
                      Confirm Booking
                      <CheckCircleIcon className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext}
                      disabled={
                        (currentStep === 'service' && !formData.serviceId) ||
                        (currentStep === 'animal' && (!formData.animalName || !formData.animalBreed)) ||
                        (currentStep === 'datetime' && (!formData.selectedDate || !formData.selectedTime))
                      }
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;