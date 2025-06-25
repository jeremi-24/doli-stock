"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Logo } from './logo';
import { ScanLine, Warehouse, FileText, Settings, Sun, Moon, LogOut, ShoppingCart } from 'lucide-react';
import { useApp } from '@/context/app-provider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { activeModules, isMounted } = useApp();
  const pathname = usePathname();
  // Simple theme toggle logic
  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    const localTheme = localStorage.getItem('theme');
    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.classList.toggle('dark', localTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!isMounted) {
    // You can return a loading skeleton here
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Logo className="h-10 w-10 animate-pulse" />
        </div>
    );
  }

  const navItems = [
    {
      href: '/',
      icon: <ScanLine />,
      label: 'Dashboard',
      active: pathname === '/',
      module: 'barcode',
    },
    {
      href: '/stock',
      icon: <Warehouse />,
      label: 'Stock',
      active: pathname === '/stock',
      module: 'stock',
    },
    {
      href: '/invoicing',
      icon: <FileText />,
      label: 'Invoicing',
      active: pathname === '/invoicing',
      module: 'invoicing',
    },
    {
      href: '/pos',
      icon: <ShoppingCart />,
      label: 'Point of Sale',
      active: pathname === '/pos',
      module: 'pos',
    },
    {
      href: '/settings',
      icon: <Settings />,
      label: 'Settings',
      active: pathname === '/settings',
      module: 'all', // Always show settings
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="w-8 h-8" />
            <span className="font-headline text-lg font-semibold text-primary">StockHero</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => 
                (activeModules[item.module as keyof typeof activeModules] || item.module === 'all') && (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton isActive={item.active}>
                      {item.icon}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center justify-start gap-2 w-full p-2 h-auto">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="user avatar"/>
                            <AvatarFallback>SH</AvatarFallback>
                        </Avatar>
                        <div className="text-left group-data-[collapsible=icon]:hidden">
                            <p className="font-semibold text-sm">Demo User</p>
                            <p className="text-xs text-muted-foreground">admin@stockhero.dev</p>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme}>
                        {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                        <span>Toggle Theme</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Header content like a global search can go here */}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        </header>
        <main className="flex-1 overflow-auto">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
