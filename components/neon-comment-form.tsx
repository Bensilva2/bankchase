'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function NeonCommentForm({
  onCommentAdded,
}: {
  onCommentAdded?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/comments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      toast.success('Comment added successfully!');
      onCommentAdded?.();
      // Reset form
      const form = document.querySelector('form') as HTMLFormElement;
      form?.reset();
    } catch (error) {
      console.error('[v0] Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">
          Add a Comment
        </label>
        <Input
          id="comment"
          name="comment"
          placeholder="Write your comment here..."
          required
          disabled={isLoading}
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Submitting...' : 'Submit Comment'}
      </Button>
    </form>
  );
}
