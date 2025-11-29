import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, ArrowLeft, Navigation, Route as RouteIcon, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import { MapView as GoogleMapView } from "@/components/Map";

export default function MapView() {
  const { user } = useAuth();
  const { data: places = [], isLoading } = trpc.places.list.useQuery();
  const [selectedPlace, setSelectedPlace] = useState<typeof places[0] | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [routeMode, setRouteMode] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<number[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const handleMapReady = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    
    // Initialize DirectionsRenderer
    const renderer = new google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: false,
    });
    setDirectionsRenderer(renderer);
  };
  
  const togglePlaceSelection = (placeId: number) => {
    setSelectedPlaces(prev => {
      if (prev.includes(placeId)) {
        return prev.filter(id => id !== placeId);
      } else {
        if (prev.length >= 10) {
          toast.error("สามารถเลือกได้สูงสุด 10 สถานที่");
          return prev;
        }
        return [...prev, placeId];
      }
    });
  };
  
  const calculateRoute = async () => {
    if (!map || !directionsRenderer || selectedPlaces.length < 2) {
      toast.error("กรุณาเลือกอย่างน้อย 2 สถานที่");
      return;
    }
    
    const selectedPlacesList = places.filter(p => selectedPlaces.includes(p.id));
    
    if (selectedPlacesList.length < 2) return;
    
    const origin = {
      lat: parseFloat(selectedPlacesList[0].latitude),
      lng: parseFloat(selectedPlacesList[0].longitude),
    };
    
    const destination = {
      lat: parseFloat(selectedPlacesList[selectedPlacesList.length - 1].latitude),
      lng: parseFloat(selectedPlacesList[selectedPlacesList.length - 1].longitude),
    };
    
    const waypoints = selectedPlacesList.slice(1, -1).map(place => ({
      location: {
        lat: parseFloat(place.latitude),
        lng: parseFloat(place.longitude),
      },
      stopover: true,
    }));
    
    const directionsService = new google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      });
      
      directionsRenderer.setDirections(result);
      
      // Calculate total distance and duration
      let totalDistance = 0;
      let totalDuration = 0;
      
      result.routes[0].legs.forEach(leg => {
        totalDistance += leg.distance?.value || 0;
        totalDuration += leg.duration?.value || 0;
      });
      
      setRouteInfo({
        distance: `${(totalDistance / 1000).toFixed(1)} กม.`,
        duration: `${Math.round(totalDuration / 60)} นาที`,
      });
      
      toast.success("คำนวณเส้นทางสำเร็จ!");
    } catch (error) {
      console.error("Error calculating route:", error);
      toast.error("ไม่สามารถคำนวณเส้นทางได้");
    }
  };
  
  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] } as any);
    }
    setSelectedPlaces([]);
    setRouteInfo(null);
    setRouteMode(false);
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Navigation className="h-8 w-8 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">แผนที่รวม</h2>
            </div>
            <div className="flex gap-2">
              {!routeMode ? (
                <Button
                  onClick={() => setRouteMode(true)}
                  className="bg-gradient-nature hover:opacity-90 gap-2"
                >
                  <RouteIcon className="h-4 w-4" />
                  วางแผนเส้นทาง
                </Button>
              ) : (
                <>
                  <Button
                    onClick={calculateRoute}
                    disabled={selectedPlaces.length < 2}
                    className="bg-gradient-nature hover:opacity-90 gap-2"
                  >
                    <RouteIcon className="h-4 w-4" />
                    คำนวณเส้นทาง ({selectedPlaces.length})
                  </Button>
                  <Button
                    onClick={clearRoute}
                    variant="outline"
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    ยกเลิก
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-lg">
              {routeMode ? "เลือกสถานที่ที่ต้องการไปเยือน (อย่างน้อย 2 สถานที่)" : "สำรวจสถานที่ท่องเที่ยวทั้งหมดบนแผนที่"}
            </p>
            {routeInfo && (
              <div className="flex gap-4 text-sm font-medium">
                <span className="text-primary">ระยะทาง: {routeInfo.distance}</span>
                <span className="text-primary">เวลา: {routeInfo.duration}</span>
              </div>
            )}
          </div>
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

            {/* Place Info or Place List */}
            <div className="lg:col-span-1">
              {routeMode && (
                <Card className="mb-4 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">สถานที่ที่เลือก</CardTitle>
                    <CardDescription>
                      เลือกสถานที่ที่ต้องการไปเยือน (สูงสุด 10 แห่ง)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-96 overflow-y-auto space-y-2">
                    {places.map((place, index) => (
                      <div
                        key={place.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          id={`place-${place.id}`}
                          checked={selectedPlaces.includes(place.id)}
                          onCheckedChange={() => togglePlaceSelection(place.id)}
                        />
                        <label
                          htmlFor={`place-${place.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          <div className="font-medium">{place.name}</div>
                          <div className="text-xs text-muted-foreground">{place.category}</div>
                        </label>
                        {selectedPlaces.includes(place.id) && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedPlaces.indexOf(place.id) + 1}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              
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
