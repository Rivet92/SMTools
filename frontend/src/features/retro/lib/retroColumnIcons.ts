import { createElement } from 'react';
import type { ComponentType } from 'react';
import type { IconProps } from '@tabler/icons-react';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconAnchor,
  IconBook,
  IconMapPin,
  IconMoodAngry,
  IconMoodHappy,
  IconMoodSad,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlayerTrackNext,
  IconSparkles,
  IconThumbUp,
  IconWind,
} from '@tabler/icons-react';

export const retroColumnIconRegistry: Record<string, ComponentType<IconProps>> = {
  AlertCircle: IconAlertCircle,
  AlertTriangle: IconAlertTriangle,
  Anchor: IconAnchor,
  Book: IconBook,
  MapPin: IconMapPin,
  MoodAngry: IconMoodAngry,
  MoodHappy: IconMoodHappy,
  MoodSad: IconMoodSad,
  PlayerPlay: IconPlayerPlay,
  PlayerStop: IconPlayerStop,
  PlayerTrackNext: IconPlayerTrackNext,
  Sparkles: IconSparkles,
  ThumbUp: IconThumbUp,
  Wind: IconWind,
};

export function getRetroColumnIcon(name: string): ComponentType<IconProps> | null {
  return retroColumnIconRegistry[name] ?? null;
}

export interface RetroColumnIconProps {
  name: string;
  color?: string;
  size?: number;
}

export function RetroColumnIcon({ name, color, size = 20 }: RetroColumnIconProps) {
  return retroColumnIconRegistry[name]
    ? createElement(retroColumnIconRegistry[name], { size, color })
    : null;
}
