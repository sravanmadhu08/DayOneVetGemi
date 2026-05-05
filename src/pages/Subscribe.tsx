import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Lock } from 'lucide-react';

const PLANS = [
  { id: '1-month', title: '1 Month', months: 1, price: '$9.99/mo', total: '$9.99' },
  { id: '3-month', title: '3 Months', months: 3, price: '$8.99/mo', total: '$26.97' },
  { id: '6-month', title: '6 Months', months: 6, price: '$7.99/mo', total: '$47.94', popular: true },
  { id: '1-year', title: '1 Year', months: 12, price: '$5.99/mo', total: '$71.88' }
];

export default function Subscribe() {
  const { subscribe, profile, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (planId: string, months: number) => {
    setLoading(true);
    await subscribe(planId, months);
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-8">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-black">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Get full access to all clinical study modules, practice questions, and flashcards.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'border-primary ring-2 ring-primary/20 shadow-xl' : 'hover:border-primary/50'} transition-all`}>
            {plan.popular && (
              <div className="absolute -top-3 inset-x-0 w-32 flex justify-center mx-auto">
                <span className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-full">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center pt-4">
              <div className="text-2xl font-black">{plan.price}</div>
              <div className="text-sm text-muted-foreground mb-6">Billed {plan.total} total</div>
              
              <ul className="space-y-3 w-full text-sm">
                {['All modules', 'Flashcards', 'Analytics', 'Clinical PDFs'].map((feature, i) => (
                  <li key={i} className="flex items-center text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full font-bold" 
                variant={plan.popular ? 'default' : 'outline'}
                disabled={loading}
                onClick={() => handleSubscribe(plan.id, plan.months)}
              >
                {loading ? 'Processing...' : (subscriptionStatus?.isActive ? 'Renew' : 'Subscribe')}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {subscriptionStatus?.isActive && subscriptionStatus.endDate && (
        <div className="text-center mt-12 p-6 bg-muted/30 rounded-2xl border border-border/50">
           <p className="font-medium text-muted-foreground flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" /> You already have an active subscription until {new Date(subscriptionStatus.endDate).toLocaleDateString()}.
           </p>
        </div>
      )}
    </div>
  );
}
