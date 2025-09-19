import type { TextStyleTemplate } from '@/types/textStyle';

export const TEXT_STYLE_TEMPLATES: Record<string, TextStyleTemplate[]> = {
  basic: [
    {
      id: 'headline-1',
      name: 'Headline',
      preview: 'Headline',
      category: 'basic',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        textAlign: 'center'
      }
    },
    {
      id: 'headline-2',
      name: 'Headline',
      preview: 'Headline',
      category: 'basic',
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#000000',
        backgroundColor: '#FFFFFF',
        padding: '8px 16px',
        borderRadius: 4,
        textAlign: 'center'
      }
    },
    {
      id: 'headline-3',
      name: 'Headline',
      preview: 'Headline',
      category: 'basic',
      style: {
        fontFamily: 'Arial',
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFF00',
        stroke: {
          color: '#000000',
          width: 2
        },
        textAlign: 'center'
      }
    }
  ],

  socialMedia: [
    {
      id: 'subscribe-red',
      name: 'SUBSCRIBE',
      preview: 'SUBSCRIBE',
      category: 'socialMedia',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        backgroundColor: '#FF0000',
        padding: '8px 16px',
        borderRadius: 4,
        textTransform: 'uppercase',
        textAlign: 'center'
      }
    },
    {
      id: 'subscribe-youtube',
      name: 'SUBSCRIBE',
      preview: 'SUBSCRIBE',
      category: 'socialMedia',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FFFFFF',
        backgroundColor: '#FF0000',
        padding: '6px 12px',
        borderRadius: 20,
        textTransform: 'uppercase',
        textAlign: 'center'
      }
    },
    {
      id: 'subscribe-outline',
      name: 'SUBSCRIBE',
      preview: 'SUBSCRIBE',
      category: 'socialMedia',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'bold',
        fontStyle: 'normal',
        color: '#FF0000',
        border: '2px solid #FF0000',
        padding: '8px 16px',
        borderRadius: 4,
        textTransform: 'uppercase',
        textAlign: 'center'
      }
    }
  ],

  title: [
    {
      id: 'text-1',
      name: 'Text',
      preview: 'Text',
      category: 'title',
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#FFFFFF',
        textAlign: 'center'
      }
    },
    {
      id: 'text-2',
      name: 'Text',
      preview: 'Text',
      category: 'title',
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        backgroundColor: '#87CEEB',
        padding: '4px 8px',
        borderRadius: 2,
        textAlign: 'center'
      }
    },
    {
      id: 'text-3',
      name: 'Text',
      preview: 'Text',
      category: 'title',
      style: {
        fontFamily: 'Arial',
        fontSize: 22,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#FFFFFF',
        backgroundColor: '#FF69B4',
        border: '2px solid #FFFFFF',
        padding: '6px 12px',
        borderRadius: 8,
        textAlign: 'center'
      }
    }
  ],

  note: [
    {
      id: 'note-1',
      name: 'Text',
      preview: 'Text',
      category: 'note',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        backgroundColor: '#FFEB3B',
        padding: '4px 8px',
        borderRadius: 2,
        textAlign: 'left'
      }
    },
    {
      id: 'note-2',
      name: 'Text',
      preview: 'Text',
      category: 'note',
      style: {
        fontFamily: 'Arial',
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#FFFFFF',
        backgroundColor: '#FF6B6B',
        padding: '6px 10px',
        borderRadius: 4,
        textAlign: 'center'
      }
    },
    {
      id: 'note-3',
      name: 'Text',
      preview: 'Text',
      category: 'note',
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'normal',
        fontStyle: 'italic',
        color: '#666666',
        textAlign: 'left'
      }
    }
  ]
};