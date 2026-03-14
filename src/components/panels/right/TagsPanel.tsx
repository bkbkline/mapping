'use client';

import { useState } from 'react';
import { useMapStore } from '@/store/mapStore';
import { useTags, useParcelTags } from '@/hooks/useTags';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Tag as TagIcon } from 'lucide-react';

export default function TagsPanel() {
  const { selectedFeatureId } = useMapStore();
  const { tags: allTags, createTag } = useTags();
  const { parcelTags, addTag, removeTag } = useParcelTags(selectedFeatureId || '');
  const [newTagName, setNewTagName] = useState('');

  if (!selectedFeatureId) {
    return <p className="text-sm text-gray-400">Select a parcel to manage tags.</p>;
  }

  const handleCreateAndAdd = async () => {
    if (!newTagName.trim()) return;
    const result = await createTag.mutateAsync({ name: newTagName.trim() });
    if (result) {
      addTag.mutate(result.id);
    }
    setNewTagName('');
  };

  const availableTags = allTags.filter(
    (t) => !parcelTags.some((pt) => pt.id === t.id)
  );

  return (
    <div className="space-y-4">
      {/* Current tags */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Applied Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {parcelTags.length === 0 && (
            <p className="text-xs text-gray-500">No tags applied</p>
          )}
          {parcelTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs h-6 gap-1"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
              <button
                onClick={() => removeTag.mutate(tag.id)}
                className="ml-0.5 hover:opacity-70"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Available tags */}
      {availableTags.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Available Tags</p>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs h-6 cursor-pointer hover:bg-white/10 border-white/10 text-gray-300"
                onClick={() => addTag.mutate(tag.id)}
              >
                <Plus className="h-2.5 w-2.5 mr-0.5" />
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Create new tag */}
      <div className="flex gap-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name..."
          className="h-8 bg-white/5 border-white/10 text-white text-xs"
          onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-white/10 text-gray-300"
          onClick={handleCreateAndAdd}
          disabled={!newTagName.trim()}
        >
          <TagIcon className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
