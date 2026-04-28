import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_MODULES } from '@/src/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PlayCircle, GraduationCap, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function StudyModules() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(MOCK_MODULES.map(m => m.category))];

  const filteredModules = MOCK_MODULES.filter(module => {
    const matchesSearch = module.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         module.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         module.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || module.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Study Modules</h1>
          <p className="text-muted-foreground">Master fundamental concepts in veterinary medicine.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search modules..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map(cat => (
              <Badge 
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"} 
                className="h-8 cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredModules.map((module, index) => (
            <motion.div
              key={module.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
            <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-primary/10">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  {profile?.progress?.[module.id] && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                      Completed {profile.progress[module.id].score}%
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{module.title}</CardTitle>
                <CardDescription>{module.category}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="line-clamp-3 text-sm text-muted-foreground">
                  {module.content.substring(0, 150)}...
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link to={`/modules/${module.id}`} className={buttonVariants({ variant: "default", className: "flex-1" })}>
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Reading
                </Link>
                <Link to="/quizzes" className={buttonVariants({ variant: "outline", size: "icon" })}>
                  <GraduationCap className="h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          </motion.div>
          ))}
        </AnimatePresence>
        {filteredModules.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">No modules found</h3>
            <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }} variant="outline">
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
