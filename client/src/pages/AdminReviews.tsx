import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Trash2, Star, MapPin } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AdminReviews() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: reviews = [], isLoading } = trpc.reviews.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.list.invalidate();
      toast.success("ลบรีวิวเรียบร้อยแล้ว");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const handleDelete = (id: number, userName: string) => {
    if (confirm(`คุณต้องการลบรีวิวของ "${userName}" ใช่หรือไม่?`)) {
      deleteReview.mutate({ id });
    }
  };

  if (authLoading || isLoading) {
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-12 w-12" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{APP_TITLE}</h1>
              <p className="text-sm text-gray-600">จัดการรีวิว</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">{user.name || user.email}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/admin">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            กลับ Dashboard
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12 flex-1">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">จัดการรีวิว</h2>
          <p className="text-gray-600">ดูและลบรีวิวที่ไม่เหมาะสม</p>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* User and Rating */}
                      <div className="flex items-center gap-3 mb-3">
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

                      {/* Place Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{review.placeName}</span>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                      )}

                      {/* Date */}
                      <p className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(review.id, review.userName || 'ผู้ใช้งาน')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deleteReview.isPending}
                    >
                      {deleteReview.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 text-lg">ยังไม่มีรีวิว</p>
              </CardContent>
            </Card>
          )}
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
