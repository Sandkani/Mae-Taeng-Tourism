import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, Heart, Trash2, ArrowLeft, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTitle, setShareTitle] = useState("สถานที่ท่องเที่ยวแนะนำของฉัน");
  const [shareDescription, setShareDescription] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  
  const createShare = trpc.sharedFavorites.create.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.shareId}`;
      setShareUrl(url);
      toast.success("สร้างลิงก์แชร์สำเร็จแล้ว!");
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาดในการสร้างลิงก์");
    },
  });
  
  const handleShare = () => {
    if (favorites.length === 0) {
      toast.error("ไม่มีรายการโปรดที่จะแชร์");
      return;
    }
    
    const placeIds = favorites.map(fav => fav.placeId).filter(id => id !== null) as number[];
    createShare.mutate({
      title: shareTitle,
      description: shareDescription,
      placeIds,
    });
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("คัดลอกลิงก์แล้ว!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareToSocial = (platform: string) => {
    const text = encodeURIComponent(`${shareTitle} - ${APP_TITLE}`);
    const url = encodeURIComponent(shareUrl);
    
    let shareLink = "";
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "line":
        shareLink = `https://social-plugins.line.me/lineit/share?url=${url}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
    }
    
    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400");
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-red-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">รายการโปรด</h2>
            </div>
            {favorites && favorites.length > 0 && (
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-nature hover:opacity-90 gap-2">
                    <Share2 className="h-4 w-4" />
                    แชร์รายการ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>แชร์รายการโปรด</DialogTitle>
                    <DialogDescription>
                      แชร์สถานที่ท่องเที่ยวที่คุณชื่นชอบไปยังเพื่อนๆ
                    </DialogDescription>
                  </DialogHeader>
                  
                  {!shareUrl ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">ชื่อรายการ</Label>
                        <Input
                          id="title"
                          value={shareTitle}
                          onChange={(e) => setShareTitle(e.target.value)}
                          placeholder="สถานที่ท่องเที่ยวแนะนำของฉัน"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">คำอธิบาย (ถ้ามี)</Label>
                        <Textarea
                          id="description"
                          value={shareDescription}
                          onChange={(e) => setShareDescription(e.target.value)}
                          placeholder="เพิ่มคำอธิบายสั้นๆ เกี่ยวกับรายการนี้"
                          rows={3}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleShare}
                          disabled={createShare.isPending || !shareTitle.trim()}
                          className="w-full bg-gradient-nature hover:opacity-90"
                        >
                          {createShare.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              กำลังสร้าง...
                            </>
                          ) : (
                            <>
                              <Share2 className="h-4 w-4 mr-2" />
                              สร้างลิงก์แชร์
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>ลิงก์สำหรับแชร์</Label>
                        <div className="flex gap-2">
                          <Input value={shareUrl} readOnly className="flex-1" />
                          <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            size="icon"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>แชร์ไปยัง</Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => shareToSocial("facebook")}
                            variant="outline"
                            className="flex-1"
                          >
                            Facebook
                          </Button>
                          <Button
                            onClick={() => shareToSocial("line")}
                            variant="outline"
                            className="flex-1"
                          >
                            Line
                          </Button>
                          <Button
                            onClick={() => shareToSocial("twitter")}
                            variant="outline"
                            className="flex-1"
                          >
                            Twitter
                          </Button>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            setShareDialogOpen(false);
                            setShareUrl("");
                            setShareTitle("สถานที่ท่องเที่ยวแนะนำของฉัน");
                            setShareDescription("");
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          ปิด
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
          <p className="text-muted-foreground text-lg">
            สถานที่ท่องเที่ยวที่คุณบันทึกไว้ ({favorites.length} แห่ง)
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
