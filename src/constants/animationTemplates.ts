import type { AnimationTemplate } from '@/types/animation';

export const ANIMATION_TEMPLATES: Record<string, AnimationTemplate[]> = {
  basic: [
    {
      id: 'fade-in',
      name: 'Fade In',
      preview: 'Fade In',
      category: 'basic',
      effects: [
        {
          type: 'entrance',
          name: 'fadeIn',
          duration: 500,
          properties: { opacity: [0, 1] }
        }
      ]
    },
    {
      id: 'slide-up',
      name: 'Slide Up',
      preview: 'Slide Up',
      category: 'basic',
      effects: [
        {
          type: 'entrance',
          name: 'slideUp',
          duration: 600,
          properties: { 
            transform: ['translateY(30px)', 'translateY(0)'],
            opacity: [0, 1]
          }
        }
      ]
    },
    {
      id: 'scale-in',
      name: 'Scale In',
      preview: 'Scale In',
      category: 'basic',
      effects: [
        {
          type: 'entrance',
          name: 'scaleIn',
          duration: 400,
          properties: { 
            transform: ['scale(0.8)', 'scale(1)'],
            opacity: [0, 1]
          }
        }
      ]
    }
  ],

  advanced: [
    {
      id: 'bounce-in',
      name: 'Bounce In',
      preview: 'Bounce In',
      category: 'advanced',
      effects: [
        {
          type: 'entrance',
          name: 'bounceIn',
          duration: 800,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          properties: { 
            transform: ['scale(0.3)', 'scale(1.05)', 'scale(0.95)', 'scale(1)'],
            opacity: [0, 1, 1, 1]
          }
        }
      ]
    },
    {
      id: 'rotate-zoom',
      name: 'Rotate Zoom',
      preview: 'Rotate Zoom',
      category: 'advanced',
      effects: [
        {
          type: 'entrance',
          name: 'rotateZoom',
          duration: 700,
          properties: { 
            transform: ['rotate(180deg) scale(0.5)', 'rotate(0) scale(1)'],
            opacity: [0, 1]
          }
        }
      ]
    },
    {
      id: 'flip-in',
      name: 'Flip In',
      preview: 'Flip In',
      category: 'advanced',
      effects: [
        {
          type: 'entrance',
          name: 'flipIn',
          duration: 600,
          properties: { 
            transform: ['rotateY(90deg)', 'rotateY(0)'],
            opacity: [0, 1]
          }
        }
      ]
    }
  ],

  featured: [
    {
      id: 'typewriter',
      name: 'Typewriter',
      preview: 'Typewriter',
      category: 'featured',
      effects: [
        {
          type: 'entrance',
          name: 'typewriter',
          duration: 1000,
          properties: { 
            width: ['0%', '100%'],
            opacity: [1, 1]
          }
        }
      ]
    },
    {
      id: 'glow-pulse',
      name: 'Glow Pulse',
      preview: 'Glow Pulse',
      category: 'featured',
      effects: [
        {
          type: 'continuous',
          name: 'glowPulse',
          duration: 2000,
          properties: { 
            textShadow: [
              '0 0 5px currentColor',
              '0 0 20px currentColor',
              '0 0 5px currentColor'
            ]
          }
        }
      ]
    },
    {
      id: 'rainbow-wave',
      name: 'Rainbow Wave',
      preview: 'Rainbow Wave',
      category: 'featured',
      effects: [
        {
          type: 'continuous',
          name: 'rainbowWave',
          duration: 3000,
          properties: { 
            color: [
              '#ff0000', '#ff8000', '#ffff00', 
              '#00ff00', '#0080ff', '#8000ff', '#ff0000'
            ]
          }
        }
      ]
    }
  ],

  custom: [
    {
      id: 'custom-entrance',
      name: 'Custom Entrance',
      preview: 'Custom',
      category: 'custom',
      effects: [
        {
          type: 'entrance',
          name: 'customEntrance',
          duration: 500,
          properties: { opacity: [0, 1] }
        }
      ]
    }
  ]
};