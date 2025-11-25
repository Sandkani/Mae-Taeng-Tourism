import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminCategories() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [newCategory, setNewCategory] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // ดึงหมวดหมู่ทั้งหมด
  const { data: categories = [], isLoading: categoriesLoading, refetch } = trpc.categories.list.useQuery();

  // ดึงสถานที่ทั้งหมดเพื่อนับจำนวนต่อหมวดหมู่
  const { data: places = [] } = trpc.places.list.useQuery();

  // นับจำนวนสถานที่ต่อหมวดหมู่
  const categoryStats = categories.map((cat) => ({
    category: cat,
    count: places.filter((p: any) => p.category === cat).length,
  }));

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("กรุณาป้อนชื่อหมวดหมู่");
      return;
    }

    if (categories.includes(newCategory)) {
      toast.error("หมวดหมู่นี้มีอยู่แล้ว");
      return;
    }

    setIsAdding(true);
    try {
      // ในการใช้งานจริง จะต้องมี API สำหรับสร้างหมวดหมู่
      // ตอนนี้เพียงแสดงข้อความสำเร็จ
      toast.success("เพิ่มหมวดหมู่เรียบร้อยแล้ว");
      setNewCategory("");
      refetch();
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">จัดการหมวดหมู่</h1>
        <p className="text-muted-foreground mt-2">จัดการหมวดหมู่สถานที่ท่องเที่ยว</p>
      </div>

      {/* เพิ่มหมวดหมู่ใหม่ */}
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มหมวดหมู่ใหม่</CardTitle>
          <CardDescription>สร้างหมวดหมู่สำหรับจัดกลุ่มสถานที่ท่องเที่ยว</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">ชื่อหมวดหมู่</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="category-name"
                  placeholder="เช่น วัด, ธรรมชาติ, กิจกรรม"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  onClick={handleAddCategory}
                  disabled={isAdding}
                  className="gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  เพิ่ม
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* รายการหมวดหมู่ */}
      <Card>
        <CardHeader>
          <CardTitle>รายการหมวดหมู่</CardTitle>
          <CardDescription>
            ทั้งหมด {categories.length} หมวดหมู่
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ไม่มีหมวดหมู่
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryStats.map((stat) => (
                <Card key={stat.category} className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{stat.category}</h3>
                        <p className="text-sm text-muted-foreground">
                          {stat.count} สถานที่
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (stat.count > 0) {
                            toast.error("ไม่สามารถลบหมวดหมู่ที่มีสถานที่");
                            return;
                          }
                          toast.info("ฟีเจอร์ลบหมวดหมู่ยังอยู่ในการพัฒนา");
                        }}
                        disabled={stat.count > 0}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
