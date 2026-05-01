import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudyModule } from "@/src/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  PlayCircle,
  GraduationCap,
  Search,
  FileText,
  ShieldCheck,
  ExternalLink,
  Zap,
  Download,
  Info,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/src/hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface ModuleProgressData {
  moduleId: string;
  currentSection: number;
  totalSections: number;
  completed: boolean;
}

import { useLocation } from "react-router-dom";

export default function StudyModules() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "modules");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [detailedProgress, setDetailedProgress] = useState<
    Record<string, ModuleProgressData>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<StudyModule[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Upload form state
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfAuthor, setPdfAuthor] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Guidelines state
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isGuidelineFormOpen, setIsGuidelineFormOpen] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<any | null>(null);
  const [guidelineFormData, setGuidelineFormData] = useState({
    title: "",
    author: "",
    date: "",
    summary: "",
    url: "",
  });

  // Fetch Modules from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchModules = async () => {
      try {
        const qModules = query(
          collection(db, "modules"),
          orderBy("order", "asc")
        );

        const snap = await getDocs(qModules);

        setModules(
          snap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as StudyModule
          )
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "modules");
      }
    };

    fetchModules();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchLibraryData = async () => {
      try {
        const [pdfSnap, guidelineSnap, resourceSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "pdfs"),
              where("userId", "in", [user.uid, "system", null]),
              orderBy("createdAt", "desc")
            )
          ),
          getDocs(
            query(
              collection(db, "guidelines"),
              orderBy("createdAt", "desc")
            )
          ),
          getDocs(
            query(
              collection(db, "resources"),
              orderBy("order", "asc")
            )
          ),
        ]);

        setPdfs(
          pdfSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        setGuidelines(
          guidelineSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );

        setResources(
          resourceSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "library data");
      }
    };

    fetchLibraryData();
  }, [user]);

  useEffect(() => {
    const fetchDetailedProgress = async () => {
      if (!user) return;
      try {
        const snap = await getDocs(
          collection(db, "users", user.uid, "moduleProgress"),
        );
        const progressMap: Record<string, ModuleProgressData> = {};
        snap.docs.forEach((doc) => {
          progressMap[doc.id] = doc.data() as ModuleProgressData;
        });
        setDetailedProgress(progressMap);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/moduleProgress`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetailedProgress();
  }, [user]);

  const categories = useMemo(() => {
    return ["All", ...new Set(modules.map((m) => m.category).filter(Boolean))];
  }, [modules]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pdfTitle) {
      toast.error("Please fill in required fields");
      return;
    }

    setIsUploading(true);
    try {
      let finalUrl = pdfUrl;
      let finalSize = "1.2 MB";

      if (selectedFile) {
        toast.error(
          "Please upload the PDF somewhere else and paste a direct URL. Storing PDFs inside Firestore can become expensive quickly."
        );
        setIsUploading(false);
        return;
      } else if (!pdfUrl) {
        toast.error("Please provide a URL or select a file.");
        setIsUploading(false);
        return;
      }

      await addDoc(collection(db, "pdfs"), {
        title: pdfTitle,
        author: pdfAuthor || user.displayName || "Contributor",
        url: finalUrl,
        size: finalSize,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Document added to library");
      setIsUploadOpen(false);
      setPdfTitle("");
      setPdfAuthor("");
      setPdfUrl("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to add PDF");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!pdfTitle) setPdfTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleOpenPdf = async (pdf: any) => {
    if (!pdf.url) return;
    try {
      if (pdf.url.startsWith("data:")) {
        const res = await fetch(pdf.url);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${pdf.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        window.open(pdf.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to open PDF", err);
      toast.error("Failed to open or download PDF.");
    }
  };

  const handleDeletePdf = async (id: string) => {
    try {
      await deleteDoc(doc(db, "pdfs", id));
      toast.success("Document removed");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to remove document");
    }
  };

  const handleSaveGuideline = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGuideline) {
        await updateDoc(doc(db, "guidelines", editingGuideline.id), {
          ...guidelineFormData,
        });
      } else {
        await addDoc(collection(db, "guidelines"), {
          ...guidelineFormData,
          createdAt: serverTimestamp(),
        });
      }
      toast.success("Guideline saved");
      setIsGuidelineFormOpen(false);
      setEditingGuideline(null);
      setGuidelineFormData({
        title: "",
        author: "",
        date: "",
        summary: "",
        url: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save guideline");
    }
  };

  const handleDeleteGuideline = async (id: string) => {
    try {
      await deleteDoc(doc(db, "guidelines", id));
      toast.success("Guideline deleted");
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return modules.filter((module) => {
      const matchesSearch =
        !q ||
        module.title?.toLowerCase().includes(q) ||
        module.category?.toLowerCase().includes(q) ||
        module.content?.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "All" || module.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [modules, searchQuery, selectedCategory]);

  const activeModules = useMemo(() => {
    return filteredModules.filter(
      (m) => profile?.progress?.[m.id]?.score !== 100
    );
  }, [filteredModules, profile?.progress]);

  const masteredModules = useMemo(() => {
    return filteredModules.filter(
      (m) => profile?.progress?.[m.id]?.score === 100
    );
  }, [filteredModules, profile?.progress]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Academy Hub
        </h1>
        <p className="text-muted-foreground font-medium">
          Your centralized clinical knowledge base and study environment.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <div className="flex items-center justify-between overflow-x-auto pb-4 sm:pb-0">
          <TabsList className="bg-muted/50 p-1.5 h-12 rounded-[20px] border border-border/50">
            <TabsTrigger
              value="modules"
              className="rounded-[16px] px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BookOpen className="w-4 h-4 mr-2" /> Modules
            </TabsTrigger>
            <TabsTrigger
              value="pdfs"
              className="rounded-[16px] px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4 mr-2" /> PDF Library
            </TabsTrigger>
            <TabsTrigger
              value="guidelines"
              className="rounded-[16px] px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 mr-2" /> Guidelines
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="rounded-[16px] px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Resources
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="modules" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-none w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search modules..."
                className="pl-9 rounded-2xl h-11 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 items-center flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="h-9 cursor-pointer whitespace-nowrap px-4 rounded-full font-bold uppercase text-[10px] tracking-widest transition-all shrink-0"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
            {profile?.isAdmin && (
              <Link
                to="/admin/modules"
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: "rounded-full shadow-sm ml-auto shrink-0",
                })}
              >
                Manage Modules
              </Link>
            )}
          </div>

          {/* Active Modules Section */}
          <div className="pb-8 space-y-4">
            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="space-y-1">
                <h3 className="font-black text-base text-primary uppercase tracking-tight flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Active Modules
                </h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Continue your clinical study and track your overall progress.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {activeModules
                  .map((module) => {
                    const prog = detailedProgress[module.id];
                    const percent = prog
                      ? Math.round(
                          ((prog.currentSection + 1) / prog.totalSections) *
                            100,
                        )
                      : 0;

                    return (
                      <motion.div
                        key={module.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-primary/10 group cursor-default overflow-hidden rounded-2xl">
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start mb-2">
                              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                                <BookOpen className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                              </div>
                              {percent > 0 ? (
                                <Badge
                                  variant="outline"
                                  className="text-primary border-primary/20 bg-primary/5 px-2 py-0.5 font-bold text-[9px] tracking-widest uppercase rounded-full"
                                >
                                  {percent}% Complete
                                </Badge>
                              ) : null}
                            </div>
                            <CardTitle className="text-lg font-black leading-tight text-foreground line-clamp-1">
                              {module.title}
                            </CardTitle>
                            <CardDescription className="uppercase tracking-[0.2em] font-bold text-[9px] mt-1 opacity-70 truncate">
                              {module.category}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1 px-4 pb-4 space-y-3">
                            <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed break-words">
                              {module.content.substring(0, 100)}...
                            </p>
                            {percent > 0 && (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest opacity-50">
                                  <span>Progress</span>
                                  <span>{percent}%</span>
                                </div>
                                <Progress value={percent} className="h-1" />
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="flex gap-2 px-4 pb-4 pt-0">
                            <Link
                              to={`/modules/${module.id}`}
                              className={buttonVariants({
                                variant: "default",
                                size: "sm",
                                className:
                                  "flex-1 rounded-xl h-8 font-black text-[10px] flex items-center justify-center uppercase tracking-widest shadow-md shadow-primary/20",
                              })}
                            >
                              {percent > 0 ? "Resume" : "Start"}
                            </Link>
                            <Link
                              to="/quizzes"
                              className={buttonVariants({
                                variant: "outline",
                                size: "icon",
                                className:
                                  "h-8 w-8 rounded-xl border-primary/20 flex items-center justify-center text-primary shrink-0",
                              })}
                            >
                              <GraduationCap className="h-4 w-4" />
                            </Link>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
              {activeModules.length === 0 &&
                filteredModules.length > 0 && (
                  <div className="col-span-full py-10 text-center space-y-4">
                    <h3 className="text-xl font-bold">All caught up!</h3>
                    <p className="text-muted-foreground">
                      You've mastered all active modules matching your criteria.
                    </p>
                  </div>
                )}
              {filteredModules.length === 0 && (
                <div className="col-span-full py-12 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold">No modules found</h3>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your filters.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mastered Modules Section */}
          {masteredModules.length > 0 && (
            <div className="pb-8 space-y-4">
              <div className="flex justify-between items-center bg-green-500/5 p-4 rounded-2xl border border-green-500/10">
                <div className="space-y-1">
                  <h3 className="font-black text-base text-green-600 uppercase tracking-tight flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Mastered Modules
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium">
                    Review the modules you've fully mastered.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {masteredModules
                  .map((module) => (
                    <Card
                      key={module.id}
                      className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-green-500/20 group cursor-default overflow-hidden rounded-2xl"
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-8 w-8 bg-green-500/10 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-2 py-0.5 font-bold text-[9px] tracking-widest uppercase rounded-full">
                            Mastered
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-black leading-tight text-foreground line-clamp-1">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="uppercase tracking-[0.2em] font-bold text-[9px] mt-1 text-green-600/70 truncate">
                          {module.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 px-4 pb-4 space-y-3">
                        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed break-words">
                          {module.content.substring(0, 100)}...
                        </p>
                      </CardContent>
                      <CardFooter className="px-4 pb-4 pt-0">
                        <Link
                          to={`/modules/${module.id}`}
                          className={buttonVariants({
                            variant: "outline",
                            size: "sm",
                            className:
                              "w-full rounded-xl h-8 font-black text-[10px] uppercase tracking-widest border-green-500/30 text-green-600 hover:bg-green-500/10",
                          })}
                        >
                          Review Module
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pdfs" className="space-y-6">
          <div className="flex justify-between items-center bg-primary/5 p-6 rounded-[32px] border border-primary/10">
            <div className="space-y-1">
              <h3 className="font-black text-lg text-primary uppercase tracking-tight flex items-center gap-2">
                <FileText className="h-5 w-5" /> Your Clinical Library
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Manage and view your uploaded veterinary medical documents.
              </p>
            </div>

            {profile?.isAdmin && (
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger
                  className={buttonVariants({
                    variant: "default",
                    className:
                      "rounded-full px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 gap-2 h-11",
                  })}
                >
                  <Download className="h-4 w-4 rotate-180" /> Upload from PC
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[32px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">
                      Add New Document
                    </DialogTitle>
                    <DialogDescription className="font-medium">
                      Select a PDF file from your computer or provide a direct
                      link.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpload} className="space-y-6 py-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest ml-1">
                          Select File
                        </Label>
                        <div className="border-2 border-dashed border-primary/20 rounded-2xl p-6 text-center hover:bg-primary/5 transition-colors cursor-pointer relative">
                          <input
                            type="file"
                            accept=".pdf"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                          />
                          <FileText className="h-8 w-8 text-primary/40 mx-auto mb-2" />
                          <p className="text-xs font-bold text-muted-foreground">
                            {selectedFile
                              ? selectedFile.name
                              : "Click or drag PDF here"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="title"
                          className="font-black uppercase text-[10px] tracking-widest ml-1"
                        >
                          Document Title
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g. Equine Surgical Protocol"
                          className="rounded-2xl h-12"
                          value={pdfTitle}
                          onChange={(e) => setPdfTitle(e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="author"
                          className="font-black uppercase text-[10px] tracking-widest ml-1"
                        >
                          Author / Organization
                        </Label>
                        <Input
                          id="author"
                          placeholder="e.g. BEVA Guide"
                          className="rounded-2xl h-12"
                          value={pdfAuthor}
                          onChange={(e) => setPdfAuthor(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="url"
                          className="font-black uppercase text-[10px] tracking-widest ml-1 text-muted-foreground"
                        >
                          Direct URL (Optional)
                        </Label>
                        <Input
                          id="url"
                          placeholder="https://example.com/document.pdf"
                          className="rounded-2xl h-12"
                          value={pdfUrl}
                          onChange={(e) => setPdfUrl(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20"
                      disabled={isUploading}
                    >
                      {isUploading ? "Registering..." : "Add to Library"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {pdfs.map((pdf) => (
              <Card
                key={pdf.id}
                className="p-6 rounded-[32px] border-primary/10 hover:shadow-lg transition-all group overflow-hidden relative"
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-foreground truncate">
                        {pdf.title}
                      </h3>
                      {pdf.userId === user?.uid && (
                        <Badge
                          variant="outline"
                          className="text-[8px] font-black uppercase tracking-tighter border-primary/20 text-primary"
                        >
                          Mine
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
                      {pdf.author} • {pdf.size}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleOpenPdf(pdf)}
                      variant="outline"
                      size="icon"
                      className="rounded-full h-12 w-12 border-primary/20 text-primary"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    {(pdf.userId === user?.uid || profile?.isAdmin) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete this document.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePdf(pdf.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="guidelines" className="space-y-6">
          <div className="flex justify-between items-center bg-primary/5 p-6 rounded-[32px] border border-primary/10">
            <div className="space-y-1">
              <h3 className="font-black text-lg text-primary uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Clinical Guidelines
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Standardized protocols and best practices.
              </p>
            </div>
            {profile?.isAdmin && (
              <Dialog
                open={isGuidelineFormOpen}
                onOpenChange={(open) => {
                  setIsGuidelineFormOpen(open);
                  if (!open) {
                    setEditingGuideline(null);
                    setGuidelineFormData({
                      title: "",
                      author: "",
                      date: "",
                      summary: "",
                      url: "",
                    });
                  }
                }}
              >
                <DialogTrigger
                  className={buttonVariants({
                    variant: "default",
                    className:
                      "rounded-full px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 gap-2 h-11",
                  })}
                >
                  Add Guideline
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-[32px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">
                      {editingGuideline ? "Edit" : "Add"} Guideline
                    </DialogTitle>
                    <DialogDescription>
                      {editingGuideline ? "Update the details for this clinical guideline." : "Add a new standardized clinical guideline to the platform."}
                    </DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={handleSaveGuideline}
                    className="space-y-4 py-4"
                  >
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest ml-1">
                        Title
                      </Label>
                      <Input
                        required
                        value={guidelineFormData.title}
                        onChange={(e) =>
                          setGuidelineFormData({
                            ...guidelineFormData,
                            title: e.target.value,
                          })
                        }
                        className="rounded-2xl h-12"
                        placeholder="Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest ml-1">
                        Author / Org
                      </Label>
                      <Input
                        value={guidelineFormData.author}
                        onChange={(e) =>
                          setGuidelineFormData({
                            ...guidelineFormData,
                            author: e.target.value,
                          })
                        }
                        className="rounded-2xl h-12"
                        placeholder="WSAVA, AAHA..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest ml-1">
                        Issued Date (String)
                      </Label>
                      <Input
                        value={guidelineFormData.date}
                        onChange={(e) =>
                          setGuidelineFormData({
                            ...guidelineFormData,
                            date: e.target.value,
                          })
                        }
                        className="rounded-2xl h-12"
                        placeholder="e.g. 2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest ml-1">
                        Summary
                      </Label>
                      <Input
                        required
                        value={guidelineFormData.summary}
                        onChange={(e) =>
                          setGuidelineFormData({
                            ...guidelineFormData,
                            summary: e.target.value,
                          })
                        }
                        className="rounded-2xl h-12"
                        placeholder="Brief description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest ml-1">
                        Read More URL
                      </Label>
                      <Input
                        value={guidelineFormData.url}
                        onChange={(e) =>
                          setGuidelineFormData({
                            ...guidelineFormData,
                            url: e.target.value,
                          })
                        }
                        className="rounded-2xl h-12"
                        placeholder="https://"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest"
                    >
                      Save
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid gap-6">
            {guidelines.map((guide) => (
              <Card
                    key={guide.id}
                    className="rounded-[32px] border-primary/10 overflow-hidden group"
                  >
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
                      <div className="p-6 md:p-10 md:w-1/3 flex flex-col justify-center gap-4 bg-muted/30">
                        <Badge className="w-fit bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full">
                          {guide.author || "Guideline"}
                        </Badge>
                        <h3 className="text-2xl md:text-3xl font-black leading-tight">
                          {guide.title}
                        </h3>
                        <p className="text-sm font-bold text-muted-foreground">
                          {guide.date}
                        </p>
                      </div>
                      <div className="p-6 md:p-10 flex-1 flex flex-col justify-between gap-6 relative">
                        <p className="text-muted-foreground leading-relaxed break-words">
                          {guide.summary}
                        </p>
                        {guide.url && (
                          <a
                            href={guide.url}
                            target="_blank"
                            rel="noreferrer"
                            className={buttonVariants({
                              variant: "ghost",
                              className:
                                "w-fit font-black text-xs uppercase tracking-widest p-0 flex items-center gap-2 group-hover:text-primary transition-colors cursor-pointer",
                            })}
                          >
                            Read Full <ArrowRight className="h-4 w-4" />
                          </a>
                        )}
                        {profile?.isAdmin && (
                          <div className="absolute top-6 right-6 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingGuideline(guide);
                                setGuidelineFormData({
                                  title: guide.title,
                                  author: guide.author || "",
                                  date: guide.date || "",
                                  summary: guide.summary || "",
                                  url: guide.url || "",
                                });
                                setIsGuidelineFormOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete this guideline.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteGuideline(guide.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex justify-between items-center bg-primary/5 p-6 rounded-[32px] border border-primary/10">
            <div className="space-y-1">
              <h3 className="font-black text-lg text-primary uppercase tracking-tight flex items-center gap-2">
                <ExternalLink className="h-5 w-5" /> External Resources
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                Quick links to veterinary associations and external tools.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.length > 0 ? (
              resources.map((res: any) => (
                <a
                  key={res.id}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group p-8 rounded-[32px] bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-background transition-all duration-300 flex flex-col justify-between min-h-[200px]"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary px-3"
                      >
                        {res.type || 'Resource'}
                      </Badge>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="text-xl font-black leading-tight group-hover:text-primary transition-colors">
                      {res.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium">
                      {res.description}
                    </p>
                  </div>
                  <div className="text-[10px] font-black text-primary/40 uppercase tracking-widest mt-6 group-hover:text-primary transition-colors">
                    {res.url.replace("https://", "")}
                  </div>
                </a>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-muted-foreground italic">
                Loading resources...
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
