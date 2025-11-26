import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Pencil, Upload, X } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AdminCategories() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [newCategory, setNewCategory] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    imageUrl: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

  // ตรวจสอบว่าเป็น admin หรือไม่
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // ดึงหมวดหมู่ทั้งหมด
  const { data: categories = [], isLoading: categoriesLoading } = trpc.categories.list.useQuery();

  // ดึงสถานที่ทั้งหมดเพื่อนับจำนวนต่อหมวดหมู่
  const { data: places = [] } = trpc.places.list.useQuery();

  const uploadFile = trpc.upload.file.useMutation();
  const createCategory = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("เพิ่มหมวดหมู่เรียบร้อยแล้ว");
      setNewCategory("");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const updateCategory = trpc.categories.update.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("แก้ไขหมวดหมู่เรียบร้อยแล้ว");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const deleteCategory = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate();
      toast.success("ลบหมวดหมู่เรียบร้อยแล้ว");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  // นับจำนวนสถานที่ต่อหมวดหมู่
  const categoryStats = categories.map((cat) => ({
    ...cat,
    count: places.filter((p: any) => p.category === cat.name).length,
  }));

  const resetForm = () => {
    setFormData({
      name: "",
      imageUrl: "",
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        imageUrl: category.imageUrl || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingImage(true);

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Upload to S3
      const result = await uploadFile.mutateAsync({
        fileName: file.name,
        fileData: base64Data,
        contentType: file.type,
      });

      setFormData({ ...formData, imageUrl: result.url });
      toast.success("อัปโหลดรูปภาพสำเร็จ");
    } catch (error) {
      toast.error(`เกิดข้อผิดพลาดในการอัปโหลด: ${error}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("กรุณาป้อนชื่อหมวดหมู่");
      return;
    }

    if (categories.some(cat => cat.name === newCategory)) {
      toast.error("หมวดหมู่นี้มีอยู่แล้ว");
      return;
    }

    createCategory.mutate({ name: newCategory });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("กรุณาป้อนชื่อหมวดหมู่");
      return;
    }

    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...formData });
    } else {
      createCategory.mutate(formData);
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = (id: number, name: string, count: number) => {
    if (count > 0) {
      toast.error("ไม่สามารถลบหมวดหมู่ที่มีสถานที่");
      return;
    }

    if (confirm(`คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่?`)) {
      deleteCategory.mutate({ id });
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
                  disabled={createCategory.isPending}
                  className="gap-2"
                >
                  {createCategory.isPending ? (
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
                <Card key={stat.id} className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {stat.imageUrl && (
                          <img
                            src={stat.imageUrl}
                            alt={stat.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold">{stat.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stat.count} สถานที่
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(stat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(stat.id, stat.name, stat.count)}
                          disabled={stat.count > 0}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลหมวดหมู่
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">ชื่อหมวดหมู่ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น วัด, ธรรมชาติ"
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>รูปภาพหมวดหมู่</Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      เลือกรูปภาพ
                    </>
                  )}
                </Button>
                {formData.imageUrl && (
                  <div className="flex items-center gap-2">
                    <img src={formData.imageUrl} alt="Preview" className="h-10 w-10 rounded object-cover" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateCategory.isPending || createCategory.isPending}
            >
              {(updateCategory.isPending || createCategory.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  กำลังบันทึก...
                </>
              ) : (
                editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
