'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  id: number;
  comment: string;
  created_at: string;
}

export function NeonCommentsList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/comments');
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error('[v0] Error fetching comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [refreshTrigger]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <p className="text-sm font-medium">{comment.comment}</p>
          <p className="text-xs text-gray-500 mt-2">
            {new Date(comment.created_at).toLocaleDateString()} at{' '}
            {new Date(comment.created_at).toLocaleTimeString()}
          </p>
        </Card>
      ))}
    </div>
  );
}
