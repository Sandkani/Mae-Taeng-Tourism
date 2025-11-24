import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: places, isLoading } = trpc.places.list.useQuery();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
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
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : isAuthenticated && user ? (
              <>
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
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default">เข้าสู่ระบบ</Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            สำรวจความงามของแม่แตง
          </h2>
          <p className="text-lg md:text-xl text-green-50 max-w-2xl mx-auto">
            ค้นพบสถานที่ท่องเที่ยวที่น่าสนใจ ธรรมชาติสวยงาม และวัฒนธรรมท้องถิ่นในอำเภอแม่แตง จังหวัดเชียงใหม่
          </p>
        </div>
      </section>

      {/* Places Grid */}
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">สถานที่ท่องเที่ยวทั้งหมด</h3>
          <p className="text-gray-600">เลือกสถานที่ที่คุณสนใจเพื่อดูรายละเอียดเพิ่มเติม</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
          </div>
        ) : places && places.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <Link key={place.id} href={`/place/${place.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={place.imageUrl || '/images/placeholder.jpg'}
                      alt={place.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 text-gray-900 hover:bg-white">
                        {place.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-xl line-clamp-1">{place.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {place.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardFooter className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {place.avgRating > 0 ? place.avgRating.toFixed(1) : 'ยังไม่มีรีวิว'}
                      </span>
                      {place.reviewCount > 0 && (
                        <span className="text-gray-400">({place.reviewCount})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{place.viewCount || 0}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">ยังไม่มีสถานที่ท่องเที่ยว</p>
          </div>
        )}
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
