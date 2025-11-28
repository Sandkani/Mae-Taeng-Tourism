import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, ArrowLeft, Navigation } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { MapView as GoogleMapView } from "@/components/Map";

export default function MapView() {
  const { user } = useAuth();
  const { data: places = [], isLoading } = trpc.places.list.useQuery();
  const [selectedPlace, setSelectedPlace] = useState<typeof places[0] | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  useEffect(() => {
    if (!map || places.length === 0) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    const newMarkers: google.maps.Marker[] = [];

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();

    places.forEach((place) => {
      const lat = parseFloat(place.latitude);
      const lng = parseFloat(place.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const position = { lat, lng };
      bounds.extend(position);

      const marker = new google.maps.Marker({
        position,
        map,
        title: place.name,
        animation: google.maps.Animation.DROP,
      });

      marker.addListener("click", () => {
        setSelectedPlace(place);
        map.panTo(position);
        map.setZoom(14);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (places.length > 0) {
      map.fitBounds(bounds);
    }
  }, [map, places]);

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
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                    <span className="sm:hidden">โปรไฟล์</span>
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button className="bg-gradient-nature hover:opacity-90 transition-all">Dashboard</Button>
                  </Link>
                )}
              </>
            ) : (
              <Link href="/">
                <Button className="bg-gradient-nature hover:opacity-90">เข้าสู่ระบบ</Button>
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
      <main className="container mx-auto px-4 pb-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Navigation className="h-8 w-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">แผนที่รวม</h2>
          </div>
          <p className="text-muted-foreground text-lg">
            สำรวจสถานที่ท่องเที่ยวทั้งหมดบนแผนที่
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดแผนที่...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-border/50">
                <CardContent className="p-0">
                  <GoogleMapView
                    initialCenter={{ lat: 19.1, lng: 98.9 }}
                    initialZoom={11}
                    className="w-full h-[600px]"
                    onMapReady={handleMapReady}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Place Info */}
            <div className="lg:col-span-1">
              {selectedPlace ? (
                <Card className="hover-lift overflow-hidden border-border/50 sticky top-24">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={selectedPlace.imageUrl || '/images/placeholder.jpg'}
                      alt={selectedPlace.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/95 text-foreground hover:bg-white shadow-lg backdrop-blur-sm">
                        {selectedPlace.category}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader>
                    <CardTitle className="line-clamp-2">{selectedPlace.name}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {selectedPlace.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{selectedPlace.viewCount || 0} ครั้ง</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {parseFloat(selectedPlace.latitude).toFixed(4)}, {parseFloat(selectedPlace.longitude).toFixed(4)}
                        </span>
                      </div>
                    </div>

                    <Link href={`/place/${selectedPlace.id}`}>
                      <Button className="w-full bg-gradient-nature hover:opacity-90">
                        ดูรายละเอียด
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>เลือกสถานที่</CardTitle>
                    <CardDescription>
                      คลิกที่ marker บนแผนที่เพื่อดูรายละเอียด
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <MapPin className="h-16 w-16 mb-4" />
                      <p className="text-center">
                        มีสถานที่ท่องเที่ยว {places.length} แห่ง<br />
                        รอคุณสำรวจ
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
