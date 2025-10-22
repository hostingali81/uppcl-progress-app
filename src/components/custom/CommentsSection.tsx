// src/components/custom/CommentsSection.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addComment, editComment, deleteComment } from "@/app/(main)/dashboard/work/[id]/actions";
import { Loader2, User, MoreHorizontal, MessageSquareX, Edit3 } from "lucide-react";
import { MentionsInput, Mention } from "react-mentions";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// टाइप परिभाषा को अपडेट करें
type Comment = {
  id: number;
  user_id: string; // टिप्पणी करने वाले की ID
  user_full_name: string | null;
  content: string;
  created_at: string;
  is_deleted: boolean;
  is_edited: boolean;
};

type MentionUser = { id: string; display: string; };

interface CommentsSectionProps {
  workId: number;
  comments: Comment[] | null;
  mentionUsers: MentionUser[];
  currentUserId: string; // वर्तमान लॉग-इन यूज़र की ID
  currentUserRole: string; // वर्तमान लॉग-इन यूज़र की भूमिका
}

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " साल पहले";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " महीने पहले";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " दिन पहले";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " घंटे पहले";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " मिनट पहले";
    return "अभी-अभी";
}

const mentionStyle = {
  control: { backgroundColor: '#fff', fontSize: 14, fontWeight: 'normal', border: '1px solid hsl(214.3 31.8% 91.4%)', borderRadius: '0.375rem' },
  '&multiLine': { control: { minHeight: 80 }, highlighter: { padding: 12 }, input: { padding: 12, outline: 'none' } },
  suggestions: {
    list: { backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.15)', borderRadius: '0.375rem', fontSize: 14, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
    item: { padding: '5px 15px', '&focused': { backgroundColor: 'hsl(210 40% 96.1%)' } },
  },
};

export function CommentsSection({ workId, comments, mentionUsers, currentUserId, currentUserRole }: CommentsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");

  const handlePostSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentContent.trim()) return;
    startTransition(async () => {
      await addComment(workId, commentContent);
      setCommentContent("");
    });
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
    if (window.confirm("क्या आप वाकई इस टिप्पणी को हटाना चाहते हैं?")) {
        startTransition(async () => {
            await deleteComment(commentId);
        });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle>चर्चा और अपडेट</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handlePostSubmit} className="flex flex-col gap-2">
          <MentionsInput
            value={commentContent}
            onChange={(event) => setCommentContent(event.target.value)}
            placeholder="किसी को टैग करने के लिए '@' लिखें..."
            style={mentionStyle}
            disabled={isPending}
            className="w-full"
            a11ySuggestionsListLabel={"Suggested mentions"}
          >
            <Mention
              trigger="@"
              data={mentionUsers}
              markup="@__display__"
              displayTransform={(id, display) => `@${display}`}
              style={{ backgroundColor: 'hsl(210 40% 96.1%)', fontWeight: '600' }}
            />
          </MentionsInput>
          <Button type="submit" disabled={isPending || !commentContent.trim()} className="self-end">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            टिप्पणी भेजें
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          {!comments || comments.length === 0 ? (
            <p className="text-sm text-center text-gray-500 py-4">अभी तक कोई टिप्पणी नहीं है। बातचीत शुरू करें!</p>
          ) : (
            [...comments].reverse().map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 relative group">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{comment.is_deleted ? 'एक यूज़र' : (comment.user_full_name || "Unknown User")}</p>
                    <div className="text-xs text-gray-500 flex items-center">
                       {comment.is_edited && !comment.is_deleted && <span className="mr-2 italic">(संपादित)</span>}
                       {formatTimeAgo(comment.created_at)}
                    </div>
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="bg-white" autoFocus />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)}>रद्द करें</Button>
                            <Button size="sm" onClick={() => handleSaveEdit(comment.id)} disabled={isPending || !editText.trim()}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} सेव करें
                            </Button>
                        </div>
                    </div>
                  ) : (
                    <p className={`text-sm mt-1 whitespace-pre-wrap ${comment.is_deleted ? 'text-gray-500 italic' : 'text-gray-700'}`}>
                        {comment.content}
                    </p>
                  )}

                  {!comment.is_deleted && !editingCommentId && (currentUserId === comment.user_id || currentUserRole === 'superadmin') && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={16}/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingCommentId(comment.id); setEditText(comment.content); }}>
                                    <Edit3 className="mr-2 h-4 w-4" /> संपादित करें
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                                    <MessageSquareX className="mr-2 h-4 w-4" /> हटाएं
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}