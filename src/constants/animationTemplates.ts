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
    },
    {
      id: 'fade-out',
      name: 'Fade Out',
      preview: 'Fade Out',
      category: 'basic',
      effects: [
        {
          type: 'exit',
          name: 'fadeOut',
          duration: 500,
          properties: { opacity: [1, 0] }
        }
      ]
    },
    {
      id: 'slide-down-out',
      name: 'Slide Down Out',
      preview: 'Slide Down',
      category: 'basic',
      effects: [
        {
          type: 'exit',
          name: 'slideDownOut',
          duration: 600,
          properties: { 
            transform: ['translateY(0)', 'translateY(30px)'],
            opacity: [1, 0]
          }
        }
      ]
    },
    {
      id: 'scale-out',
      name: 'Scale Out',
      preview: 'Scale Out',
      category: 'basic',
      effects: [
        {
          type: 'exit',
          name: 'scaleOut',
          duration: 400,
          properties: { 
            transform: ['scale(1)', 'scale(0.8)'],
            opacity: [1, 0]
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
    },
    {
      id: 'bounce-out',
      name: 'Bounce Out',
      preview: 'Bounce Out',
      category: 'advanced',
      effects: [
        {
          type: 'exit',
          name: 'bounceOut',
          duration: 800,
          easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          properties: { 
            transform: ['scale(1)', 'scale(1.05)', 'scale(0.95)', 'scale(0.3)'],
            opacity: [1, 1, 1, 0]
          }
        }
      ]
    },
    {
      id: 'rotate-zoom-out',
      name: 'Rotate Zoom Out',
      preview: 'Rotate Out',
      category: 'advanced',
      effects: [
        {
          type: 'exit',
          name: 'rotateZoomOut',
          duration: 700,
          properties: { 
            transform: ['rotate(0) scale(1)', 'rotate(-180deg) scale(0.5)'],
            opacity: [1, 0]
          }
        }
      ]
    },
    {
      id: 'flip-out',
      name: 'Flip Out',
      preview: 'Flip Out',
      category: 'advanced',
      effects: [
        {
          type: 'exit',
          name: 'flipOut',
          duration: 600,
          properties: { 
            transform: ['rotateY(0)', 'rotateY(-90deg)'],
            opacity: [1, 0]
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
    },
    {
      id: 'typewriter-reverse',
      name: 'Typewriter Reverse',
      preview: 'Type Reverse',
      category: 'featured',
      effects: [
        {
          type: 'exit',
          name: 'typewriterReverse',
          duration: 1000,
          properties: { 
            width: ['100%', '0%'],
            opacity: [1, 1]
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