import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, ArrowLeft, Send } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const placeId = parseInt(id || "0");
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: place, isLoading } = trpc.places.getById.useQuery({ id: placeId });
  const { data: reviews = [] } = trpc.reviews.getByPlaceId.useQuery({ placeId });
  const incrementView = trpc.places.incrementView.useMutation();
  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      utils.reviews.getByPlaceId.invalidate({ placeId });
      utils.places.getById.invalidate({ id: placeId });
      toast.success("เพิ่มรีวิวเรียบร้อยแล้ว");
      setRating(5);
      setComment("");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasViewed, setHasViewed] = useState(false);

  // Increment view count once per session
  useEffect(() => {
    if (place && !hasViewed) {
      incrementView.mutate({ placeId });
      setHasViewed(true);
    }
  }, [place, hasViewed]);

  const handleSubmitReview = () => {
    if (!isAuthenticated) {
      toast.error("กรุณาเข้าสู่ระบบก่อนเขียนรีวิว");
      return;
    }
    createReview.mutate({ placeId, rating, comment });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <MapPin className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-600 text-lg mb-4">ไม่พบสถานที่ท่องเที่ยวนี้</p>
        <Link href="/">
          <Button variant="default">กลับหน้าแรก</Button>
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
            {isAuthenticated && user ? (
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
              <a href={getLoginUrl()}>
                <Button className="bg-gradient-nature hover:opacity-90 transition-all">เข้าสู่ระบบ</Button>
              </a>
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

      {/* Place Details */}
      <main className="container mx-auto px-4 pb-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl hover-lift">
              <img
                src={place.imageUrl || '/images/placeholder.jpg'}
                alt={place.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <Badge className="bg-white/95 text-foreground text-base px-4 py-1.5 shadow-lg backdrop-blur-sm">
                  {place.category}
                </Badge>
              </div>
            </div>

            {/* Title and Stats */}
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-4">{place.name}</h2>
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium text-lg">
                    {place.avgRating > 0 ? place.avgRating.toFixed(1) : 'ยังไม่มีรีวิว'}
                  </span>
                  {place.reviewCount > 0 && (
                    <span className="text-gray-400">({place.reviewCount} รีวิว)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  <span>{place.viewCount || 0} ครั้ง</span>
                </div>
              </div>
            </div>

            {/* Video */}
            {place.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>วิดีโอบรรยายสถานที่</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={place.videoUrl}
                      title="วิดีโอบรรยายสถานที่"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Narration */}
            {place.audioUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>เสียงบรรยายสถานที่</CardTitle>
                </CardHeader>
                <CardContent>
                  <audio
                    controls
                    className="w-full"
                    src={place.audioUrl}
                  >
                    บราวเชื่อเสียงของคุณไม่สนับสนุน HTML5 audio
                  </audio>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียด</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {place.description}
                </p>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>รีวิวจากผู้เยี่ยมชม</CardTitle>
                <CardDescription>
                  {reviews.length > 0 ? `มีรีวิวทั้งหมด ${reviews.length} รายการ` : 'ยังไม่มีรีวิว'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {review.userName || 'ผู้ใช้งาน'}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-700">{review.comment}</p>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสถานที่นี้!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Add Review Form */}
            {isAuthenticated ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle>เขียนรีวิว</CardTitle>
                  <CardDescription>แบ่งปันประสบการณ์ของคุณกับผู้อื่น</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>คะแนน</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(i + 1)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 cursor-pointer transition-colors ${
                              i < rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="comment">ความคิดเห็น (ไม่บังคับ)</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="แบ่งปันประสบการณ์ของคุณ..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={createReview.isPending}
                    className="w-full gap-2"
                  >
                    {createReview.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        ส่งรีวิว
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600 mb-4">กรุณาเข้าสู่ระบบเพื่อเขียนรีวิว</p>
                  <a href={getLoginUrl()}>
                    <Button variant="default">เข้าสู่ระบบ</Button>
                  </a>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  ตำแหน่งที่ตั้ง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={`https://www.google.com/maps?q=${place.latitude},${place.longitude}&hl=th&z=14&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>ละติจูด:</strong> {place.latitude}</p>
                  <p><strong>ลองจิจูด:</strong> {place.longitude}</p>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${place.latitude},${place.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-4"
                >
                  <Button variant="outline" className="w-full">
                    เปิดใน Google Maps
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
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
