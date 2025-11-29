import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, ArrowLeft, User } from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect, useState } from "react";

export default function SharedFavorites() {
  const { shareId } = useParams<{ shareId: string }>();
  const { user } = useAuth();
  const { data: sharedList, isLoading } = trpc.sharedFavorites.getByShareId.useQuery(
    { shareId: shareId || "" },
    { enabled: !!shareId }
  );
  const incrementView = trpc.sharedFavorites.incrementView.useMutation();
  const [hasViewed, setHasViewed] = useState(false);

  // Increment view count once per session
  useEffect(() => {
    if (sharedList && !hasViewed && shareId) {
      incrementView.mutate({ shareId });
      setHasViewed(true);
    }
  }, [sharedList, hasViewed, shareId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!sharedList) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <MapPin className="h-20 w-20 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">ไม่พบรายการนี้</h2>
        <p className="text-muted-foreground mb-6">รายการที่คุณกำลังมองหาอาจถูกลบหรือไม่มีอยู่</p>
        <Link href="/">
          <Button className="bg-gradient-nature hover:opacity-90">กลับหน้าแรก</Button>
        </Link>
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
              <Link href="/favorites">
                <Button variant="ghost" className="gap-2">
                  รายการโปรดของฉัน
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
        {/* Header Info */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {sharedList.title}
          </h2>
          {sharedList.description && (
            <p className="text-muted-foreground text-lg mb-4">
              {sharedList.description}
            </p>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {sharedList.creator && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>แชร์โดย: {sharedList.creator.name || sharedList.creator.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{sharedList.viewCount || 0} ครั้ง</span>
            </div>
          </div>
        </div>

        {/* Places Grid */}
        {sharedList.places && sharedList.places.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sharedList.places.map((place) => (
              <Link key={place.id} href={`/place/${place.id}`}>
                <Card className="h-full hover-lift cursor-pointer overflow-hidden border-border/50 group">
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
                        <Eye className="h-4 w-4" />
                        <span>{place.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">
                          {parseFloat(place.latitude).toFixed(2)}, {parseFloat(place.longitude).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <MapPin className="h-20 w-20 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-2">ไม่มีสถานที่ในรายการ</h3>
            <p className="text-muted-foreground">รายการนี้ยังไม่มีสถานที่ท่องเที่ยว</p>
          </div>
        )}
      </main>
    </div>
  );
}
