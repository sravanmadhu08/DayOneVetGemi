import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';
import { 
  Stethoscope, 
  BookOpen, 
  GraduationCap, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut,
  Brain,
  Timer as TimerIcon,
  TrendingUp,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { buttonVariants } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const { user, profile, signIn, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Flashcards', path: '/flashcards', icon: Brain },
    { name: 'Study Modules', path: '/modules', icon: BookOpen },
    { name: 'Quizzes', path: '/quizzes', icon: GraduationCap },
    { name: 'Analytics', path: '/progress', icon: TrendingUp },
  ];

  const NavContent = ({ mobile = false }) => (
    <div className={mobile ? 'flex flex-col space-y-4 mt-8' : 'flex items-center space-x-6'}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setIsOpen(false)}
          className={`flex items-center space-x-1.5 text-sm font-semibold transition-all hover:text-primary ${
            location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter">Vetica</span>
          </Link>
          <div className="hidden md:flex">
            <NavContent />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.photoURL || ''} alt={profile?.displayName || ''} />
                  <AvatarFallback>{profile?.displayName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/import')}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Import Questions</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={signIn} size="sm">Sign In</Button>
          )}

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger
                render={(props) => (
                  <Button {...props} variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                )}
              />
              <SheetContent side="left">
                <NavContent mobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
