import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, Eye, Upload, X } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function AdminPlaces() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data: places = [], isLoading } = trpc.places.list.useQuery();
  const { data: categories = [] } = trpc.categories.list.useQuery();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    latitude: "",
    longitude: "",
    imageUrl: "",
    videoUrl: "",
    audioUrl: "",
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = trpc.upload.file.useMutation();

  const createPlace = trpc.places.create.useMutation({
    onSuccess: () => {
      utils.places.list.invalidate();
      toast.success("เพิ่มสถานที่เรียบร้อยแล้ว");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const updatePlace = trpc.places.update.useMutation({
    onSuccess: () => {
      utils.places.list.invalidate();
      toast.success("แก้ไขสถานที่เรียบร้อยแล้ว");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const deletePlace = trpc.places.delete.useMutation({
    onSuccess: () => {
      utils.places.list.invalidate();
      toast.success("ลบสถานที่เรียบร้อยแล้ว");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      latitude: "",
      longitude: "",
      imageUrl: "",
      videoUrl: "",
      audioUrl: "",
    });
    setEditingPlace(null);
  };

  const handleOpenDialog = (place?: any) => {
    if (place) {
      setEditingPlace(place);
      setFormData({
        name: place.name,
        description: place.description,
        category: place.category,
        latitude: place.latitude,
        longitude: place.longitude,
        imageUrl: place.imageUrl || "",
        videoUrl: place.videoUrl || "",
        audioUrl: place.audioUrl || "",
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video' | 'audio') => {
    try {
      // Set loading state
      if (type === 'image') setUploadingImage(true);
      else if (type === 'video') setUploadingVideo(true);
      else setUploadingAudio(true);

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
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

      // Update form data
      if (type === 'image') {
        setFormData({ ...formData, imageUrl: result.url });
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } else if (type === 'video') {
        setFormData({ ...formData, videoUrl: result.url });
        toast.success("อัปโหลดวิดีโอสำเร็จ");
      } else {
        setFormData({ ...formData, audioUrl: result.url });
        toast.success("อัปโหลดเสียงบรรยายสำเร็จ");
      }
    } catch (error) {
      toast.error(`เกิดข้อผิดพลาดในการอัปโหลด: ${error}`);
    } finally {
      if (type === 'image') setUploadingImage(false);
      else if (type === 'video') setUploadingVideo(false);
      else setUploadingAudio(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.category || !formData.latitude || !formData.longitude) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (editingPlace) {
      updatePlace.mutate({ id: editingPlace.id, ...formData });
    } else {
      createPlace.mutate(formData);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`คุณต้องการลบ "${name}" ใช่หรือไม่?`)) {
      deletePlace.mutate({ id });
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
              <p className="text-sm text-gray-600">จัดการสถานที่ท่องเที่ยว</p>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">จัดการสถานที่ท่องเที่ยว</h2>
            <p className="text-gray-600">เพิ่ม แก้ไข หรือลบสถานที่ท่องเที่ยว</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            เพิ่มสถานที่ใหม่
          </Button>
        </div>

        {/* Places Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานที่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      หมวดหมู่
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ยอดวิว
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      รีวิว
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {places.length > 0 ? (
                    places.map((place) => (
                      <tr key={place.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={place.imageUrl || '/images/placeholder.jpg'}
                              alt={place.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">{place.name}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">{place.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            {place.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Eye className="h-4 w-4" />
                            <span>{place.viewCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {place.reviewCount || 0} รายการ
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(place)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(place.id, place.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        ยังไม่มีสถานที่ท่องเที่ยว
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlace ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลสถานที่ท่องเที่ยว
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">ชื่อสถานที่ *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="เช่น วัดเด่นสะหลีศรีเมืองแกน"
              />
            </div>

            <div>
              <Label htmlFor="description">รายละเอียด *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายเกี่ยวกับสถานที่นี้..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">หมวดหมู่ *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">ละติจูด *</Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="19.1234"
                  />
                </div>

                <div>
                  <Label htmlFor="longitude">ลองจิจูด *</Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="98.9876"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label>รูปภาพ</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'image');
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

            {/* Video Upload */}
            <div>
              <Label>วิดีโอ</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'video');
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={uploadingVideo}
                  className="gap-2"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      เลือกวิดีโอ
                    </>
                  )}
                </Button>
                {formData.videoUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">✓ อัปโหลดแล้ว</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, videoUrl: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Upload */}
            <div>
              <Label>เสียงบรรยาย</Label>
              <div className="flex items-center gap-2">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'audio');
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={uploadingAudio}
                  className="gap-2"
                >
                  {uploadingAudio ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      เลือกเสียงบรรยาย
                    </>
                  )}
                </Button>
                {formData.audioUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">✓ อัปโหลดแล้ว</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, audioUrl: "" })}
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
              disabled={createPlace.isPending || updatePlace.isPending}
            >
              {(createPlace.isPending || updatePlace.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  กำลังบันทึก...
                </>
              ) : (
                editingPlace ? 'บันทึกการแก้ไข' : 'เพิ่มสถานที่'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
