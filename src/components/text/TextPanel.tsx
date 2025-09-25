import { BasicStylesTab } from './BasicStylesTab';
import { SocialMediaTab } from './SocialMediaTab';
import { TitleStylesTab } from './TitleStylesTab';
import { NoteStylesTab } from './NoteStylesTab';

export function TextPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-0">
        <BasicStylesTab />
        <SocialMediaTab />
        <TitleStylesTab />
        <NoteStylesTab />
      </div>
    </div>
  );
}