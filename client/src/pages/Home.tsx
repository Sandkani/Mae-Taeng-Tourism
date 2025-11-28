import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { MapPin, Star, Eye, Loader2, Sparkles, Search, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: places, isLoading } = trpc.places.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name"); // name, rating, views
  
  // Filter and sort places
  const filteredPlaces = useMemo(() => {
    if (!places) return [];
    
    let filtered = [...places];
    
    // Search by name
    if (searchQuery) {
      filtered = filtered.filter(place =>
        place.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "rating") {
        return (b.avgRating || 0) - (a.avgRating || 0);
      } else if (sortBy === "views") {
        return (b.viewCount || 0) - (a.viewCount || 0);
      } else {
        return a.name.localeCompare(b.name, 'th');
      }
    });
    
    return filtered;
  }, [places, searchQuery, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with glass morphism */}
      <header className="glass sticky top-0 z-50 border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all duration-300">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12 rounded-full shadow-md" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">จังหวัดเชียงใหม่</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 md:gap-4">
            {authLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isAuthenticated && user ? (
              <>
                <Link href="/favorites">
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                    <span className="hidden sm:inline">รายการโปรด</span>
                    <span className="sm:hidden">โปรด</span>
                  </Button>
                </Link>
                <Link href="/map">
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                    <span className="hidden sm:inline">แผนที่</span>
                    <span className="sm:hidden">แผนที่</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" className="gap-2 hover:bg-primary/10">
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                    <span className="sm:hidden">โปรไฟล์</span>
                  </Button>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin">
                    <Button className="bg-gradient-nature hover:opacity-90 transition-all">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
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

      {/* Hero Section with animated gradient */}
      <section className="relative bg-gradient-nature text-white py-20 md:py-28 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">อำเภอแม่แตง จังหวัดเชียงใหม่</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            สำรวจความงามของ<br />
            <span className="inline-block mt-2">แม่แตง</span>
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-8">
            ค้นพบสถานที่ท่องเที่ยวที่น่าสนใจ ธรรมชาติสวยงาม และวัฒนธรรมท้องถิ่น
          </p>
          
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all">
                เริ่มต้นสำรวจ
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Places Grid */}
      <main className="container mx-auto px-4 py-16 flex-1">
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              สถานที่ท่องเที่ยวทั้งหมด
            </h3>
            <p className="text-muted-foreground text-lg">
              เลือกสถานที่ที่คุณสนใจเพื่อดูรายละเอียดเพิ่มเติม
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto">
            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาชื่อสถานที่..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="หมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort */}
                  <div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue placeholder="เรียงลำดับ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">ชื่อ (A-Z)</SelectItem>
                        <SelectItem value="rating">คะแนนสูงสุด</SelectItem>
                        <SelectItem value="views">ยอดวิวสูงสุด</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Results count */}
                <div className="mt-4 text-sm text-muted-foreground text-center">
                  พบ {filteredPlaces.length} สถานที่
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดสถานที่ท่องเที่ยว...</p>
          </div>
        ) : filteredPlaces && filteredPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPlaces.map((place) => (
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
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
                      {place.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-muted-foreground">
                      {place.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardFooter className="flex items-center justify-between text-sm pt-0">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-foreground">
                        {place.avgRating > 0 ? place.avgRating.toFixed(1) : 'ไม่มีรีวิว'}
                      </span>
                      {place.reviewCount > 0 && (
                        <span className="text-muted-foreground">({place.reviewCount})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">ยังไม่มีสถานที่ท่องเที่ยว</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-nature text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded-full" />
              <div className="text-left">
                <p className="font-semibold">{APP_TITLE}</p>
                <p className="text-sm text-white/80">จังหวัดเชียงใหม่</p>
              </div>
            </div>
            <p className="text-white/80 text-sm">
              © 2024 {APP_TITLE}. สงวนลิขสิทธิ์.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
