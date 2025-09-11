

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
import { LayoutDashboard, Warehouse, Settings, Sun, Moon, LogOut, ShoppingCart, Tag, PanelLeft, FilePlus, History, Building2, ClipboardList, PackagePlus, Users, FileStack, Truck, Bell, Package, FileText as InvoiceIcon, FileSignature } from 'lucide-react';
import { useApp } from '@/context/app-provider'; 
import { useNotifications } from '@/context/notification-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function NotificationBell() {
  const { notifications, markAsRead, unreadCount } = useNotifications();

  const handleNotificationClick = (notif: any) => {
    if (!notif.lu) {
      markAsRead(notif.id);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{unreadCount}</Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 font-semibold border-b">Notifications</div>
        <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">Aucune notification pour le moment.</p>
            ) : (
                <div className="divide-y">
                    {notifications.map(notif => (
                        <div key={notif.id} className={cn("p-4 text-sm cursor-pointer hover:bg-muted/50", !notif.lu && "bg-accent/50")} onClick={() => handleNotificationClick(notif)}>
                            <p className="font-semibold">{notif.type}</p>
                            <p className="text-muted-foreground">{notif.message}</p>
                             {notif.date && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    {format(new Date(notif.date), 'd MMM yyyy, HH:mm', { locale: fr })}
                                </p>
                             )}
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
        {notifications.length > 0 && (
          <div className="p-2 border-t">
              <Button variant="link" size="sm" className="w-full" onClick={() => markAsRead()}>Marquer tout comme lu</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}


function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isMounted, shopInfo, logout, isAuthenticated, currentUser, hasPermission } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  
  const [theme, setTheme] = React.useState('light');
  const [logoError, setLogoError] = React.useState(false);

  React.useEffect(() => {
    const localTheme = localStorage.getItem('theme');
    if (localTheme) {
      setTheme(localTheme);
      document.documentElement.classList.toggle('dark', localTheme === 'dark');
    }
  }, []);

  React.useEffect(() => {
    setLogoError(false);
  }, [shopInfo.logoUrl]);

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
    } else if (isAuthenticated && isAuthPage) {
      router.push('/');
    }
  }, [isMounted, isAuthenticated, isAuthPage, router, pathname]);


  if (!isMounted || (!isAuthenticated && !isAuthPage) || (isAuthenticated && isAuthPage)) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Logo className="h-10 w-10 animate-pulse" />
        </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  const getAvatarFallback = () => {
    if (currentUser?.email) {
      return currentUser.email.substring(0, 2).toUpperCase();
    }
    return "UD";
  }
  
  const navItems = [
    {
      href: '/',
      icon: <LayoutDashboard />,
      label: 'Tableau de Bord',
      active: pathname === '/',
      permission: 'PRODUIT_READ',
    },
    {
      href: '/stock',
      icon: <Warehouse />,
      label: 'État du Stock',
      active: pathname === '/stock',
    },
     {
      href: '/products',
      icon: <Package />,
      label: 'Produits',
      active: pathname.startsWith('/products'),
      permission: 'PRODUIT_READ',
    },
    {
      href: '/orders',
      icon: <FileStack />,
      label: 'Commandes',
      active: pathname.startsWith('/orders'),
      permission: 'COMMANDE_READ',
    },
    {
      href: '/invoicing',
      icon: <InvoiceIcon />,
      label: 'Factures',
      active: pathname.startsWith('/invoicing'),
      permission: 'FACTURE_GENERATE',
    },
    {
      href: '/invoice-templates',
      icon: <FileSignature />,
      label: 'Modèles de Facture',
      active: pathname.startsWith('/invoice-templates'),
      permission: 'FACTURE_GENERATE',
    },
    {
      href: '/deliveries',
      icon: <Truck />,
      label: 'Bons de Livraison',
      active: pathname.startsWith('/deliveries'),
      permission: 'LIVRAISON_READ',
    },
    {
      href: '/sales',
      icon: <History />,
      label: 'Historique des Ventes',
      active: pathname === '/sales',
      permission: 'VENTE_CREATE',
    },
    {
      href: '/categories',
      icon: <Tag />,
      label: 'Catégories',
      active: pathname === '/categories',
    },
    {
      href: '/entrepots',
      icon: <Building2 />,
      label: 'Lieux de Stock',
      active: pathname === '/entrepots',
    },
    {
      href: '/clients',
      icon: <Users />,
      label: 'Clients',
      active: pathname === '/clients',
    },
    {
      href: '/inventories',
      icon: <ClipboardList />,
      label: 'Inventaires',
      active: pathname.startsWith('/inventories'),
      permission: 'INVENTAIRE_MANAGE',
    },
    {
      href: '/reapprovisionnements',
      icon: <PackagePlus />,
      label: 'Réapprovisionnement',
      active: pathname.startsWith('/reapprovisionnements'),
      permission: 'REAPPRO_MANAGE',
    },
    {
      href: '/pos',
      icon: <ShoppingCart />,
      label: 'Point de Vente',
      active: pathname === '/pos',
      permission: 'VENTE_CREATE',

    },
    {
      href: '/settings',
      icon: <Settings />,
      label: 'Paramètres',
      active: pathname === '/settings',
      permission: 'USER_MANAGE',
    },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.permission) {
        return hasPermission(item.permission);
    }
    return true;
  });

  return (
    <>
      <Sidebar>
        <SidebarRail />
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center">
              {shopInfo.logoUrl && !logoError ? (
                <img 
                  src={shopInfo.logoUrl} 
                  alt={`${shopInfo.nom} Logo`} 
                  className="h-full w-auto object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Logo className="w-8 h-8" />
              )}
            </div>
            <span className="font-headline text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">{shopInfo.nom.split(' ')[0]}</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
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
                            <AvatarFallback>{getAvatarFallback()}</AvatarFallback>
                        </Avatar>
                        <div className="text-left group-data-[collapsible=icon]:hidden">
                            <p className="font-semibold text-sm">{currentUser?.roleNom}</p>
                            <p className="text-xs text-muted-foreground">{currentUser?.email || 'email@example.com'}</p>
                        </div>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start" className="w-56">
                    <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled>
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
            <div className="flex items-center gap-2">
                <NotificationBell />
                <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Changer de thème</span>
                </Button>
            </div>
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
