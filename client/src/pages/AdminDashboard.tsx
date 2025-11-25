import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, BarChart3, Eye, MapPin, MessageSquare, Plus } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = trpc.stats.getViewStats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });
  const { data: places = [] } = trpc.places.list.useQuery();

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>ไม่มีสิทธิ์เข้าถึง</CardTitle>
            <CardDescription>คุณต้องเป็นผู้ดูแลระบบเพื่อเข้าถึงหน้านี้</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAuthenticated ? (
              <a href={getLoginUrl()}>
                <Button variant="default" className="w-full">เข้าสู่ระบบ</Button>
              </a>
            ) : null}
            <Link href="/">
              <Button variant="outline" className="w-full">กลับหน้าแรก</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPlaces = places.length;
  const totalReviews = places.reduce((sum, place) => sum + (place.reviewCount || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
              <p className="text-sm text-gray-600">ระบบจัดการ</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost">หน้าแรก</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">{user.name || user.email}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">ภาพรวมและสถิติของระบบ</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                ยอดวิวทั้งหมด
              </CardTitle>
              <Eye className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.totalViews || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">ครั้ง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                สถานที่ท่องเที่ยว
              </CardTitle>
              <MapPin className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalPlaces}
              </div>
              <p className="text-sm text-gray-500 mt-1">แห่ง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                รีวิวทั้งหมด
              </CardTitle>
              <MessageSquare className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalReviews}
              </div>
              <p className="text-sm text-gray-500 mt-1">รายการ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                หมวดหมู่
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats?.viewsByCategory?.length || 0}
              </div>
              <p className="text-sm text-gray-500 mt-1">หมวด</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Top Places */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Views by Category */}
          <Card>
            <CardHeader>
              <CardTitle>ยอดวิวแยกตามหมวดหมู่</CardTitle>
              <CardDescription>สถิติการเข้าชมแต่ละประเภท</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.viewsByCategory && stats.viewsByCategory.length > 0 ? (
                <div className="space-y-4">
                  {stats.viewsByCategory.map((item, index) => {
                    const maxCount = Math.max(...stats.viewsByCategory.map(v => v.count || 0));
                    const percentage = maxCount > 0 ? ((item.count || 0) / maxCount) * 100 : 0;
                    
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {item.category || 'ไม่ระบุ'}
                          </span>
                          <span className="text-sm text-gray-600">
                            {item.count || 0} ครั้ง
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-green-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">ยังไม่มีข้อมูล</p>
              )}
            </CardContent>
          </Card>

          {/* Top 3 Places */}
          <Card>
            <CardHeader>
              <CardTitle>สถานที่ยอดนิยม Top 3</CardTitle>
              <CardDescription>สถานที่ที่มียอดวิวสูงสุด</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.topPlaces && stats.topPlaces.length > 0 ? (
                <div className="space-y-4">
                  {stats.topPlaces.map((place, index) => (
                    <div key={place.id} className="flex items-center gap-4">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-full font-bold text-white
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{place.name}</p>
                        <p className="text-sm text-gray-500">{place.category}</p>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{place.viewCount || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">ยังไม่มีข้อมูล</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>จัดการสถานที่ท่องเที่ยว</CardTitle>
              <CardDescription>เพิ่ม แก้ไข หรือลบสถานที่ท่องเที่ยว</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/places">
                <Button className="w-full gap-2">
                  <MapPin className="h-4 w-4" />
                  จัดการสถานที่ท่องเที่ยว
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>จัดการรีวิว</CardTitle>
              <CardDescription>ดูและลบรีวิวที่ไม่เหมาะสม</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reviews">
                <Button className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  จัดการรีวิว
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ดูความเห็นทั้งหมด</CardTitle>
              <CardDescription>ดูและจัดการความเห็นของผู้ใช้</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/comments">
                <Button className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  ดูความเห็น
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>จัดการหมวดหมู่</CardTitle>
              <CardDescription>จัดการหมวดหมู่สถานที่ท่องเที่ยว</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/categories">
                <Button className="w-full gap-2">
                  <BarChart3 className="h-4 w-4" />
                  จัดการหมวดหมู่
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 {APP_TITLE} | ระบบจัดการ
          </p>
        </div>
      </footer>
    </div>
  );
}
