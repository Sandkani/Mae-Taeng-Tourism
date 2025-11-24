import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, LogOut, User, Mail, Calendar, Shield } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("ออกจากระบบเรียบร้อยแล้ว");
      window.location.href = "/";
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>กรุณาเข้าสู่ระบบ</CardTitle>
            <CardDescription>คุณต้องเข้าสู่ระบบก่อนเข้าถึงหน้านี้</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href={getLoginUrl()}>
              <Button variant="default" className="w-full">เข้าสู่ระบบ</Button>
            </a>
            <Link href="/">
              <Button variant="outline" className="w-full">กลับหน้าแรก</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
              <p className="text-sm text-gray-600">จังหวัดเชียงใหม่</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/profile">
              <Button variant="ghost" className="gap-2">
                <span className="hidden sm:inline">{user.name || user.email}</span>
                <span className="sm:hidden">โปรไฟล์</span>
              </Button>
            </Link>
            {user.role === 'admin' && (
              <Link href="/admin">
                <Button variant="default">Dashboard</Button>
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

      {/* Profile Content */}
      <main className="container mx-auto px-4 pb-12 flex-1">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">โปรไฟล์ของฉัน</h2>
            <p className="text-gray-600">ข้อมูลบัญชีผู้ใช้งาน</p>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลส่วนตัว
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">ชื่อ</p>
                  <p className="font-medium text-gray-900">{user.name || 'ไม่ระบุ'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">อีเมล</p>
                  <p className="font-medium text-gray-900">{user.email || 'ไม่ระบุ'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">บทบาท</p>
                  <p className="font-medium text-gray-900">
                    {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งานทั่วไป'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">เข้าสู่ระบบล่าสุด</p>
                  <p className="font-medium text-gray-900">
                    {new Date(user.lastSignedIn).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>การจัดการบัญชี</CardTitle>
              <CardDescription>ดำเนินการกับบัญชีของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                {logout.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังออกจากระบบ...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 {APP_TITLE} | จังหวัดเชียงใหม่
          </p>
        </div>
      </footer>
    </div>
  );
}
