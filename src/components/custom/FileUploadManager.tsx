// src/components/custom/FileUploadManager.tsx
"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addAttachmentToWork, generateUploadUrl, deleteAttachment } from "@/app/(main)/dashboard/work/[id]/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ImageIcon, Trash2, User, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// अटैचमेंट के लिए टाइप परिभाषा
type Attachment = {
  id: number;
  file_url: string;
  file_name: string | null;
  uploader_full_name: string | null;
  uploader_id: string;
  created_at: string;
};

interface FileUploadManagerProps {
  workId: number;
  attachments: Attachment[] | null;
  currentUserId: string;
}

// फाइल के प्रकार का पता लगाने के लिए हेल्पर फंक्शन
const getFileType = (url: string) => {
  const extension = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  return 'other';
};

export function FileUploadManager({ workId, attachments, currentUserId }: FileUploadManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (files.length === 0) {
      setMessage("कृपया अपलोड करने के लिए कम से कम एक फाइल चुनें।");
      return;
    }

    startTransition(async () => {
      let uploadCount = 0;
      for (const file of files) {
        const { success: urlResult, error: urlError } = await generateUploadUrl(file.name, file.type);
        if (urlError || !urlResult) {
          setMessage(`Error generating URL: ${urlError || 'Unknown error'}`);
          return;
        }

        const uploadResponse = await fetch(urlResult.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type }});
        if (!uploadResponse.ok) {
          setMessage(`Upload failed for ${file.name}.`);
          return;
        }

        const { error: dbError } = await addAttachmentToWork(workId, urlResult.publicFileUrl, file.name);
        if (dbError) {
          setMessage(`Failed to save attachment to DB: ${dbError}`);
          return;
        }
        uploadCount++;
      }
      
      setMessage(`${uploadCount} फाइल(ें) सफलतापूर्वक अपलोड हो गईं!`);
      setFiles([]);
      const form = event.target as HTMLFormElement;
      form.reset();
    });
  };

  const handleDelete = (attachmentId: number) => {
    if (window.confirm("क्या आप वाकई इस फाइल को हटाना चाहते हैं?")) {
      startTransition(async () => {
        const result = await deleteAttachment(attachmentId, workId);
        // --- यहाँ पहला बदलाव किया गया है (TypeScript एरर फिक्स) ---
        setMessage(result.error || result.success || null);
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>फाइल मैनेजमेंट</CardTitle>
        <CardDescription>कार्य से संबंधित तस्वीरें या PDF दस्तावेज़ अपलोड करें।</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">फाइलें चुनें</Label>
            <Input id="file-upload" type="file" multiple onChange={handleFileChange} disabled={isPending} />
          </div>
          <Button type="submit" disabled={isPending || files.length === 0}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isPending ? "अपलोड हो रहा है..." : `${files.length} फाइल(ें) अपलोड करें`}
          </Button>
          {message && <p className={`text-sm mt-2 ${message.includes('successfully') || message.includes('सफलतापूर्वक') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
        </form>
        
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">अपलोड की गई फाइलें</h3>
          {!attachments || attachments.length === 0 ? (
            <p className="text-sm text-gray-500">कोई फाइल अपलोड नहीं की गई है।</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {attachments.map((att) => (
                <div key={att.id} className="relative group border rounded-lg p-2 flex flex-col justify-between bg-white">
                  {/* --- यहाँ दूसरा बदलाव किया गया है (Tailwind सुझाव) --- */}
                  <Link href={att.file_url} target="_blank" rel="noopener noreferrer" className="grow">
                    <div className="relative aspect-square w-full overflow-hidden flex items-center justify-center bg-gray-100 rounded-md mb-2">
                       {getFileType(att.file_url) === 'image' ? (
                         <Image src={att.file_url} alt={att.file_name || 'Uploaded image'} fill className="object-cover" sizes="(max-width: 768px) 50vw, 20vw" />
                       ) : (
                         <div className="text-center p-2">
                           {getFileType(att.file_url) === 'pdf' ? <FileText className="h-8 w-8 mx-auto text-red-500" /> : <ImageIcon className="h-8 w-8 mx-auto text-gray-500" />}
                         </div>
                       )}
                       <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                    </div>
                  </Link>
                  <div className="text-xs mt-auto">
                    <p className="font-medium truncate">{att.file_name || "Untitled"}</p>
                    <p className="text-gray-500 flex items-center gap-1"><User size={12} /> {att.uploader_full_name?.split(' ')[0] || 'N/A'}</p>
                  </div>
                  {(currentUserId === att.uploader_id) && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(att.id)}
                      disabled={isPending}
                      aria-label="Delete file"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}