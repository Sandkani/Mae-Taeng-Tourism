import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, Heart, Trash2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Favorites() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: favorites = [], isLoading } = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const utils = trpc.useUtils();
  const removeFavorite = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.list.invalidate();
      toast.success("ลบออกจากรายการโปรดแล้ว");
    },
  });

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
        <Heart className="h-20 w-20 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-muted-foreground mb-6">คุณต้องเข้าสู่ระบบเพื่อดูรายการโปรด</p>
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
            <Link href="/profile">
              <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                <span className="hidden sm:inline">{user?.name || user?.email}</span>
                <span className="sm:hidden">โปรไฟล์</span>
              </Button>
            </Link>
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button className="bg-gradient-nature hover:opacity-90 transition-all">Dashboard</Button>
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
          <div className="flex items-center gap-3 mb-3">
            <Heart className="h-8 w-8 text-red-500 fill-red-500" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">รายการโปรด</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            สถานที่ท่องเที่ยวที่คุณบันทึกไว้
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดรายการโปรด...</p>
          </div>
        ) : favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((fav) => {
              const place = fav.place;
              if (!place) return null;
              
              return (
                <Card key={fav.id} className="h-full hover-lift overflow-hidden border-border/50 group relative">
                  <Link href={`/place/${place.id}`}>
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={place.imageUrl || '/images/placeholder.jpg'}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/95 text-foreground hover:bg-white shadow-lg backdrop-blur-sm">
                          {place.category}
                        </Badge>
                      </div>
                    </div>
                  </Link>

                  <CardHeader>
                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                      {place.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {place.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>N/A</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{place.viewCount || 0}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={() => removeFavorite.mutate({ placeId: place.id })}
                      disabled={removeFavorite.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      ลบออกจากรายการโปรด
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <Heart className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">ยังไม่มีรายการโปรด</h3>
            <p className="text-muted-foreground mb-6">เริ่มต้นบันทึกสถานที่ที่คุณชื่นชอบกันเถอะ</p>
            <Link href="/">
              <Button className="bg-gradient-nature hover:opacity-90">เริ่มสำรวจ</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
