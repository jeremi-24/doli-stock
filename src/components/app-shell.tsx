"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  useSidebar,
  SidebarRail,
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
import { LayoutDashboard, Warehouse, Settings, Sun, Moon, LogOut, ShoppingCart, Tag, PanelLeft, FilePlus, History, FileSignature, Building2 } from 'lucide-react';
import { useApp } from '@/context/app-provider'; 
import { cn } from '@/lib/utils';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { activeModules, isMounted, shopInfo, logout, isAuthenticated } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  
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
  
  const handleLogout = () => {
    logout();
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isPosPage = pathname === '/pos';

  React.useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, setOpenMobile]);

  React.useEffect(() => {
    if (!isMounted) return;
    if (!isAuthenticated && !isAuthPage) {
        router.push('/login');
    }
  }, [isMounted, isAuthenticated, isAuthPage, pathname, router]);


  if (!isMounted || (!isAuthenticated && !isAuthPage)) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Logo className="h-10 w-10 animate-pulse" />
        </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }
  
  const navItems = [
    {
      href: '/',
      icon: <LayoutDashboard />,
      label: 'Tableau de Bord',
      active: pathname === '/',
      module: 'all', 
    },
    {
      href: '/stock',
      icon: <Warehouse />,
      label: 'Stock',
      active: pathname === '/stock',
      module: 'stock',
    },
    {
      href: '/categories',
      icon: <Tag />,
      label: 'Catégories',
      active: pathname === '/categories',
      module: 'stock',
    },
    {
      href: '/entrepots',
      icon: <Building2 />,
      label: 'Entrepôts',
      active: pathname === '/entrepots',
      module: 'stock',
    },
    {
      href: '/pos',
      icon: <ShoppingCart />,
      label: 'Point de Vente',
      active: pathname === '/pos',
      module: 'pos',
    },
    {
      href: '/invoicing',
      icon: <FilePlus />,
      label: 'Facturation',
      active: pathname === '/invoicing',
      module: 'invoicing',
    },
     {
      href: '/invoice-templates',
      icon: <FileSignature />,
      label: 'Modèles Facture',
      active: pathname === '/invoice-templates',
      module: 'invoicing',
    },
    {
      href: '/sales',
      icon: <History />,
      label: 'Ventes',
      active: pathname === '/sales',
      module: 'invoicing',
    },
    {
      href: '/settings',
      icon: <Settings />,
      label: 'Paramètres',
      active: pathname === '/settings',
      module: 'all',
    },
  ];

  return (
    <>
      <Sidebar>
        <SidebarRail />
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Logo className="w-8 h-8" />
            <span className="font-headline text-lg font-semibold text-primary">{shopInfo.name.split(' ')[0]}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => 
                (item.module === 'all' || activeModules[item.module as keyof typeof activeModules]) && (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton isActive={item.active} size="lg" tooltip={item.label}>
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
                            <AvatarFallback>UD</AvatarFallback>
                        </Avatar>
                        <div className="text-left group-data-[collapsible=icon]:hidden">
                            <p className="font-semibold text-sm">Utilisateur Démo</p>
                            <p className="text-xs text-muted-foreground">admin@stockhero.dev</p>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={toggleTheme}>
                        {theme === 'light' ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                        <span>Changer de Thème</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className={cn("flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6 sticky top-0 z-30", isPosPage && "hidden")}>
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Changer de thème</span>
            </Button>
        </header>
        {isPosPage && (
            <div className="absolute top-4 left-4 z-40">
                <SidebarTrigger className="bg-card/80 backdrop-blur-sm" />
            </div>
        )}
        <main className={cn("flex-1 overflow-auto", isPosPage && "h-screen")}>
            {children}
        </main>
      </SidebarInset>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
        <AppShellContent>{children}</AppShellContent>
    </SidebarProvider>
  );
}
