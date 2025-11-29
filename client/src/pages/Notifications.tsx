import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Bell, Loader2, ArrowLeft, Check, Trash2, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Notifications() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: notifications = [], isLoading } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  
  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
    },
  });
  
  const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("ทำเครื่องหมายอ่านทั้งหมดแล้ว");
    },
  });
  
  const deleteNotification = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.unreadCount.invalidate();
      toast.success("ลบการแจ้งเตือนแล้ว");
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Bell className="h-20 w-20 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-muted-foreground mb-6">คุณต้องเข้าสู่ระบบเพื่อดูการแจ้งเตือน</p>
        <a href={getLoginUrl()}>
          <Button className="bg-gradient-nature hover:opacity-90">เข้าสู่ระบบ</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12 rounded-full shadow-md" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">จังหวัดเชียงใหม่</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            {user && (
              <Link href="/profile">
                <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                  <span className="hidden sm:inline">{user.name || user.email}</span>
                  <span className="sm:hidden">โปรไฟล์</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าแรก
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 flex-1">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">การแจ้งเตือน</h2>
            </div>
            {notifications && notifications.length > 0 && notifications.some(n => !n.isRead) && (
              <Button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                variant="outline"
                className="gap-2"
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                ทำเครื่องหมายอ่านทั้งหมด
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            การแจ้งเตือนและข่าวสารล่าสุด ({notifications.filter(n => !n.isRead).length} ใหม่)
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover-lift overflow-hidden border ${
                  notification.isRead ? 'border-border/50 opacity-75' : 'border-primary/30 shadow-md'
                } ${getTypeColor(notification.type)}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{notification.title}</CardTitle>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">ใหม่</Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm whitespace-pre-wrap">
                          {notification.message}
                        </CardDescription>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.isRead && (
                        <Button
                          onClick={() => markAsRead.mutate({ notificationId: notification.id })}
                          disabled={markAsRead.isPending}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteNotification.mutate({ notificationId: notification.id })}
                        disabled={deleteNotification.isPending}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {notification.link && (
                  <CardContent>
                    <Link href={notification.link}>
                      <Button variant="outline" size="sm" className="w-full">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Bell className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">ไม่มีการแจ้งเตือน</h3>
            <p className="text-muted-foreground">คุณยังไม่มีการแจ้งเตือนใดๆ</p>
          </div>
        )}
      </main>
    </div>
  );
}
