import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ClockIcon, CurrencyEuroIcon, ShieldCheckIcon, HeartIcon } from '@heroicons/react/24/outline';

const ServicesPage: React.FC = () => {
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => apiClient.getServices(true)
  });

  const services = servicesData?.data || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Professional Osteopathy Services
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive range of specialized treatments designed to address your dog's unique needs and health goals
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service: any, index: number) => (
              <Card key={service.id} className="relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
                {index === 1 && (
                  <Badge className="absolute -top-2 left-4 bg-blue-600 text-white">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center">
                      <HeartIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">€{service.price}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {service.duration} min
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-2 mb-6">
                    {/* Dynamic features based on service type */}
                    {['Professional assessment', 'Gentle treatment techniques', 'Personalized care plan', 'Follow-up support', 'Expert guidance'].map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Link to={`/booking?service=${service.id}`}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Book This Service
                      </Button>
                    </Link>
                    <Link to={`/services/${service.id}`}>
                      <Button variant="outline" className="w-full">
                        Learn More
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-12 bg-red-50 border-t border-red-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-red-800 mb-2">Emergency Situations</h3>
          <p className="text-red-700 mb-4">
            For urgent cases or emergencies, please contact your veterinarian immediately. 
            Osteopathy is complementary to veterinary care, not a replacement.
          </p>
          <Button variant="outline" className="border-red-300 text-red-800 hover:bg-red-100">
            Find Emergency Vet
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;