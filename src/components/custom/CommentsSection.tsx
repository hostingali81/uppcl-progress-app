"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addComment, editComment, deleteComment } from "@/app/(main)/dashboard/work/[id]/actions";
import { Loader2, User, MoreHorizontal, MessageSquare, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Comment = {
  id: number;
  user_id: string;
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showArchive, setShowArchive] = useState(false);

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

  const handlePostSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!commentContent.trim()) return;

    const mentionedIds = mentionedUsers
      .filter(user => commentContent.includes(`@${user.display}`))
      .map(user => user.id);

    startTransition(async () => {
      const result = await addComment(workId, commentContent, mentionedIds);
      if (result?.success) {
        setCommentContent("");
        setMentionedUsers([]);
      }
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
    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900">Discussion & Updates</CardTitle>
            <p className="text-sm text-slate-600">Share updates and collaborate with your team</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handlePostSubmit} className="flex flex-col gap-3 mb-6">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={commentContent}
              onChange={handleTextChange}
              placeholder="Write a comment... (Type '@' to mention someone)"
              disabled={isPending}
              className="w-full min-h-[100px] resize-none"
              rows={4}
            />
            {showMentions && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-64 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
          <Button type="submit" disabled={isPending || !commentContent.trim()} className="self-end bg-blue-600 hover:bg-blue-700 text-white">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Post Comment
          </Button>
        </form>

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
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Save
                            </Button>
                        </div>
                    </div>
                  ) : (
                    <p className={`text-sm whitespace-pre-wrap ${comment.is_deleted ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                        {comment.content}
                    </p>
                  )}

                  {!comment.is_deleted && !editingCommentId && (currentUserId === comment.user_id || currentUserRole === 'superadmin') && (
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-200"><MoreHorizontal size={16}/></Button>
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
