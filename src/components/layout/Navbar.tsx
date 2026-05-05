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
  TrendingUp,
  Settings,
  LayoutDashboard
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ThemeToggle } from './ThemeToggle';

export default function Navbar() {
  const { user, profile, signIn, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Flashcards', path: '/flashcards', icon: Brain },
    { name: 'Modules', path: '/modules', icon: BookOpen },
    { name: 'Quizzes', path: '/quizzes', icon: GraduationCap },
  ];

  const NavContent = ({ mobile = false }) => (
    <div className={mobile ? 'flex flex-col space-y-6 mt-12 px-2' : 'flex items-center space-x-1'}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => setIsOpen(false)}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-xl ${
            location.pathname === item.path 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <item.icon className="h-4 w-4" />
          <span>{item.name}</span>
        </Link>
      ))}
    </div>
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-[1400px] mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5 transition-transform active:scale-95">
            <div className="rounded-xl bg-primary p-2 text-primary-foreground shadow-lg shadow-primary/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-foreground hidden sm:block">
              DayOne<span className="text-primary italic">Vet</span>
            </span>
          </Link>
          
          <div className="hidden lg:flex">
            <NavContent />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="group focus:outline-none">
                <div className="flex items-center gap-3 p-1 rounded-full border border-transparent group-hover:border-border/50 group-hover:bg-muted/30 transition-all pr-3">
                  <Avatar className="h-8 w-8 rounded-lg shadow-sm border border-border/50">
                    <AvatarImage src={profile?.photoURL || ''} alt={profile?.displayName || ''} className="rounded-lg" />
                    <AvatarFallback className="rounded-lg font-black text-[10px]">{profile?.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-none gap-1">
                    <span className="text-xs font-black text-foreground">{profile?.displayName}</span>
                    {profile?.isAdmin && <span className="text-[8px] font-black uppercase tracking-widest text-primary">Staff Access</span>}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mt-2 rounded-2xl p-2 shadow-2xl" align="end">
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-black text-foreground uppercase tracking-widest leading-none mb-1">Authenticated</p>
                    <p className="text-[10px] font-medium text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-2 bg-border/50" />
                <DropdownMenuGroup className="space-y-1">
                  {profile?.isAdmin && (
                    <DropdownMenuItem 
                      onClick={() => navigate('/admin/settings')}
                      className="rounded-xl font-bold text-xs py-2 data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Admin Control
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')}
                    className="rounded-xl font-bold text-xs py-2"
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/progress')}
                    className="rounded-xl font-bold text-xs py-2 sm:hidden"
                  >
                    <TrendingUp className="mr-3 h-4 w-4" />
                    Analytics
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-2 bg-border/50" />
                <DropdownMenuItem 
                  onClick={() => logout()}
                  className="rounded-xl font-bold text-xs py-2 text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Terminate Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={signIn} 
              size="sm" 
              className="rounded-xl font-black uppercase tracking-widest text-[10px] h-9 px-5 shadow-lg shadow-primary/20"
            >
              Sign In
            </Button>
          )}

          <div className="lg:hidden ml-1">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l border-border/50">
                <SheetHeader className="text-left border-b border-border/50 pb-6">
                  <SheetTitle className="text-xl font-black tracking-tighter">
                    DayOne<span className="text-primary italic">Vet</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs font-bold uppercase tracking-widest opacity-50 px-0.5">
                    Navigation Menu
                  </SheetDescription>
                </SheetHeader>
                <NavContent mobile />
                <div className="mt-8 pt-8 border-t border-border/50 px-2 flex flex-col gap-4">
                  <div className="space-y-1">
                    <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-2">Account</p>
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                      <UserIcon className="h-4 w-4 text-primary" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/progress"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-4 px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span>Analytics</span>
                    </Link>
                    {profile?.isAdmin && (
                      <Link
                        to="/admin/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground hover:bg-muted rounded-xl transition-all"
                      >
                        <Settings className="h-4 w-4 text-primary" />
                        <span>Admin Control</span>
                      </Link>
                    )}
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsOpen(false);
                        logout();
                      }}
                      className="w-full justify-start gap-4 px-4 py-6 text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Terminate Session</span>
                    </Button>
                  </div>
                   <div className="pt-4 flex justify-center">
                      <ThemeToggle />
                   </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

