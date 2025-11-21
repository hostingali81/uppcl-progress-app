"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addComment, editComment, deleteComment } from "@/app/(main)/dashboard/work/[id]/actions";
import { Loader2, User, MoreHorizontal, MessageSquare, Edit3, Trash2, ChevronDown, ChevronUp, Paperclip, X, TrendingUp, Save, Target } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Comment = {
  id: number;
  user_id: string;
  user_full_name: string | null;
  content: string;
  created_at: string;
  is_deleted: boolean;
  is_edited: boolean;
  attachments?: {
    id: number;
    file_url: string;
    file_name: string;
    attachment_type: string;
  }[];
};

type MentionUser = { id: string; display: string; };

interface CommentsSectionProps {
  workId: number;
  comments: Comment[] | null;
  mentionUsers: MentionUser[];
  currentUserId: string;
  currentUserRole: string;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "just now";
}

export function CommentsSection({ workId, comments, mentionUsers, currentUserId, currentUserRole }: CommentsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<MentionUser[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showArchive, setShowArchive] = useState(false);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [newCommentId, setNewCommentId] = useState<number | null>(null);

  useEffect(() => {
    console.log('mentionUsers:', mentionUsers);
  }, [mentionUsers]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setCommentContent(value);

    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (user: MentionUser) => {
    const before = commentContent.substring(0, mentionPosition);
    const after = commentContent.substring(mentionPosition + mentionSearch.length + 1);
    const newContent = `${before}@${user.display} ${after}`;
    setCommentContent(newContent);

    if (!mentionedUsers.some(u => u.id === user.id)) {
      setMentionedUsers([...mentionedUsers, user]);
    }

    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredUsers = mentionUsers.filter(u =>
    u.display.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/',
        'application/pdf',
        'text/',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
        'application/vnd.openxmlformats-officedocument' // Generic fallback
      ];

      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return false;
      }

      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        alert(`File type "${file.type}" (${file.type}) is not supported.`);
        return false;
      }

      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentContent.trim()) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const mentionedIds = mentionedUsers
        .filter(user => commentContent.includes(`@${user.display}`))
        .map(user => user.id);

      startTransition(async () => {
        // Pass empty array for attachments initially
        const result = await addComment(workId, commentContent, mentionedIds, []);

        if (result?.success) {
          setNewCommentId(result.commentId || null); // Ensure addComment returns commentId
          setStep(2);
          setMessage({ text: "Comment posted! You can now upload attachments.", type: "success" });
          setCommentContent("");
          setMentionedUsers([]);
        } else {
          setMessage({ text: "Failed to post comment.", type: "error" });
        }
        setIsUploading(false);
      });
    } catch (error: unknown) {
      console.error('Post error:', error);
      setMessage({ text: `Failed to post comment: ${error instanceof Error ? error.message : 'Unknown error'}`, type: "error" });
      setIsUploading(false);
    }
  };

  const handleAttachmentUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (attachments.length === 0 || !newCommentId) return;

    setIsUploading(true);
    setMessage(null);

    try {
      const uploadPromises = attachments.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workId', workId.toString());
        formData.append('attachmentType', 'document');
        formData.append('comment_id', newCommentId.toString());

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }
        return response.json();
      });

      await Promise.all(uploadPromises);

      setMessage({ text: "Attachments uploaded successfully!", type: "success" });
      setAttachments([]);

      // Close dialog after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (error: unknown) {
      console.error('Upload error:', error);
      setMessage({ text: `Failed to upload attachments: ${error instanceof Error ? error.message : 'Unknown error'}`, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep(1);
    setMessage(null);
    setNewCommentId(null);
    setAttachments([]);
    setCommentContent("");
  };


  const handleSaveEdit = (commentId: number) => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await editComment(commentId, editText);
      setEditingCommentId(null);
      setEditText("");
    });
  };

  const handleDelete = (commentId: number) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      startTransition(async () => {
        await deleteComment(commentId);
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">Discussion & Updates</CardTitle>
            <p className="text-sm text-slate-600">Share updates and collaborate with your team</p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageSquare className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md top-12 translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <DialogTitle>
                  {step === 1 ? "Add Comment" : "Upload Attachments"}
                </DialogTitle>
              </div>
            </DialogHeader>

            {step === 1 && (
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div className="relative">
                  <Label>Comment</Label>
                  <Textarea
                    ref={textareaRef}
                    value={commentContent}
                    onChange={handleTextChange}
                    placeholder="Write a comment... (Type '@' to mention someone)"
                    disabled={isPending || isUploading}
                    className="w-full min-h-[100px] resize-none mt-1"
                    rows={4}
                  />
                  {showMentions && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-64 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full left-0">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => insertMention(user)}
                          className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{user.display}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {mentionUsers.length > 0 && (
                  <div className="text-xs text-slate-500">
                    💡 Type @ to mention: {mentionUsers.slice(0, 3).map(u => u.display).join(', ')}{mentionUsers.length > 3 ? ` +${mentionUsers.length - 3} more` : ''}
                  </div>
                )}

                {message && (
                  <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.text}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button type="submit" disabled={isPending || isUploading || !commentContent.trim()}>
                    {(isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Post Comment
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <Target className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="text-md font-semibold mb-1">Comment Posted!</h3>
                  <p className="text-gray-600 text-sm mb-4">You can now upload attachments for this comment.</p>
                </div>

                <form onSubmit={handleAttachmentUpload} className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="attachment-upload">Select Files</Label>
                    <Input
                      id="attachment-upload"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500">
                      Max 10MB per file. Supported: Images, PDF, DOC, TXT
                    </p>

                    {attachments.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-3 border">
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">Selected Files ({attachments.length})</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Paperclip className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{file.name}</span>
                                <span className="text-xs text-slate-500 flex-shrink-0">({formatFileSize(file.size)})</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
                              >
                                <X className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message && (
                      <div className={`p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message.text}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="submit" disabled={attachments.length === 0 || isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleClose}>
                      <X className="h-4 w-4 mr-2" />
                      Skip & Close
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {!comments || comments.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No comments yet. Start the conversation!</p>
            </div>
          ) : (
            (showArchive ? [...comments] : [...comments].slice(0, 4)).map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 relative group">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-slate-900">{comment.is_deleted ? 'A user' : (comment.user_full_name || "Unknown User")}</p>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      {comment.is_edited && !comment.is_deleted && <span className="italic">(edited)</span>}
                      {formatTimeAgo(comment.created_at)}
                    </div>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="bg-white border-slate-200 mb-2" autoFocus />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveEdit(comment.id)} disabled={isPending || !editText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={`text-sm whitespace-pre-wrap mb-2 ${comment.is_deleted ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                        {comment.content}
                      </p>

                      {/* Display attachments if any */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">Attachments ({comment.attachments.length})</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {comment.attachments.map((attachment) => (
                              <div key={attachment.id} className="bg-white p-2 rounded border">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                  <a
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 truncate"
                                    title={attachment.file_name}
                                  >
                                    {attachment.file_name}
                                  </a>
                                </div>
                                {attachment.attachment_type === 'site_photo' && (
                                  <img
                                    src={attachment.file_url}
                                    alt={attachment.file_name}
                                    className="mt-2 w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(attachment.file_url, '_blank')}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {!comment.is_deleted && !editingCommentId && (currentUserId === comment.user_id || currentUserRole === 'superadmin') && (
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-200"><MoreHorizontal size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingCommentId(comment.id); setEditText(comment.content); }}>
                            <Edit3 className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Show Archive Button - Only when there are more than 4 comments */}
          {!showArchive && comments && comments.length > 4 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowArchive(true)}
                className="text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Archive/Old Data ({comments.length - 4} more)
              </Button>
            </div>
          )}

          {/* Show Less Button - Only when archive is shown */}
          {showArchive && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowArchive(false)}
                className="text-slate-600 hover:text-slate-800 border-slate-300 hover:border-slate-400"
              >
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Archive
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
