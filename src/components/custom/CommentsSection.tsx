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

// Updated type definitions
type Comment = {
  id: number;
  user_id: string; // ID of the commenter
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
  currentUserId: string; // Current logged-in user's ID
  currentUserRole: string; // Current logged-in user's role
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
    if (window.confirm("Are you sure you want to delete this comment?")) {
        startTransition(async () => {
            await deleteComment(commentId);
        });
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquareX className="h-5 w-5 text-blue-600" />
          </div>
          <CardTitle className="text-lg font-semibold text-slate-900">Discussion & Updates</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handlePostSubmit} className="flex flex-col gap-2">
          <MentionsInput
            value={commentContent}
            onChange={(event) => setCommentContent(event.target.value)}
            placeholder="Type '@' to tag someone..."
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
          <Button type="submit" disabled={isPending || !commentContent.trim()} className="self-end bg-blue-600 hover:bg-blue-700 text-white">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Comment
          </Button>
        </form>

        <div className="mt-6 space-y-4">
          {!comments || comments.length === 0 ? (
            <p className="text-sm text-center text-slate-500 py-4">No comments yet. Start the conversation!</p>
          ) : (
            [...comments].reverse().map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className="shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-500" />
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg px-4 py-2 relative group">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-sm">{comment.is_deleted ? 'A user' : (comment.user_full_name || "Unknown User")}</p>
                    <div className="text-xs text-slate-500 flex items-center">
                       {comment.is_edited && !comment.is_deleted && <span className="mr-2 italic">(edited)</span>}
                       {formatTimeAgo(comment.created_at)}
                    </div>
                  </div>
                  
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                        <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="bg-white border-slate-200" autoFocus />
                        <div className="flex justify-end gap-2 mt-2">
                            <Button size="sm" variant="ghost" onClick={() => setEditingCommentId(null)} className="border-slate-200">Cancel</Button>
                            <Button size="sm" onClick={() => handleSaveEdit(comment.id)} disabled={isPending || !editText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save
                            </Button>
                        </div>
                    </div>
                  ) : (
                    <p className={`text-sm mt-1 whitespace-pre-wrap ${comment.is_deleted ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                        {comment.content}
                    </p>
                  )}

                  {!comment.is_deleted && !editingCommentId && (currentUserId === comment.user_id || currentUserRole === 'superadmin') && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100"><MoreHorizontal size={16}/></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingCommentId(comment.id); setEditText(comment.content); }}>
                                    <Edit3 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(comment.id)} className="text-red-600 focus:bg-red-50 focus:text-red-600">
                                    <MessageSquareX className="mr-2 h-4 w-4" /> Delete
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