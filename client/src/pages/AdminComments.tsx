import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Search } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminComments() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlace, setFilterPlace] = useState<string>("");

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // ดึงความเห็นทั้งหมด
  const { data: allReviews = [], isLoading: reviewsLoading } = trpc.reviews.list.useQuery();
  
  // ลบความเห็น
  const deleteReviewMutation = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบความเห็นเรียบร้อยแล้ว");
      // Refetch reviews
      trpc.useUtils().reviews.list.invalidate();
    },
    onError: () => {
      toast.error("เกิดข้อผิดพลาดในการลบความเห็น");
    },
  });

  // กรองความเห็นตามคำค้นหา
  const filteredReviews = allReviews.filter((review: any) => {
    const matchesSearch = 
      review.placeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlace = !filterPlace || review.placeName === filterPlace;
    
    return matchesSearch && matchesPlace;
  });

  // ดึงรายชื่อสถานที่ที่มีความเห็น
  const uniquePlaces = Array.from(
    new Set(allReviews.map((r: any) => r.placeName).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">จัดการความเห็น</h1>
        <p className="text-muted-foreground mt-2">ดูและจัดการความเห็นของผู้ใช้งาน</p>
      </div>

      {/* ค้นหาและกรอง */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสถานที่, ผู้ใช้, หรือความเห็น..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterPlace} onValueChange={setFilterPlace}>
              <SelectTrigger>
                <SelectValue placeholder="กรองตามสถานที่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ทั้งหมด</SelectItem>
                {uniquePlaces.map((place) => (
                  <SelectItem key={place} value={place as string}>
                    {place}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ตารางความเห็น */}
      <Card>
        <CardHeader>
          <CardTitle>รายการความเห็น</CardTitle>
          <CardDescription>
            ทั้งหมด {filteredReviews.length} ความเห็น
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่มีความเห็น
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สถานที่</TableHead>
                    <TableHead>ผู้ใช้</TableHead>
                    <TableHead>คะแนน</TableHead>
                    <TableHead>ความเห็น</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">{review.placeName}</TableCell>
                      <TableCell>{review.userName || "ไม่ระบุ"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
                          {review.rating}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{review.comment || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("th-TH")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("คุณแน่ใจหรือว่าต้องการลบความเห็นนี้?")) {
                              deleteReviewMutation.mutate({ id: review.id });
                            }
                          }}
                          disabled={deleteReviewMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
